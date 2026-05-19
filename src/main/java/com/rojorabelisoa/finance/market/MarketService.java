package com.rojorabelisoa.finance.market;

import com.rojorabelisoa.finance.market.dto.FundamentalsDto;
import com.rojorabelisoa.finance.market.dto.QuoteDto;
import com.rojorabelisoa.finance.market.dto.SearchResultDto;
import com.rojorabelisoa.finance.shared.fmp.FmpClient;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MarketService {

    private final FmpClient fmp;

    @Cacheable(value = "quotes", unless = "#result.price() == null")
    public QuoteDto getQuote(String ticker) {
        try {
            // profile works for all markets (free tier); quote only for US
            Map<?, ?> p = fmp.getFirst("/profile?symbol=" + encode(ticker));
            if (p == null) return emptyQuote(ticker);

            return new QuoteDto(
                    str(p, "symbol"),
                    str(p, "companyName"),
                    toDouble(p.get("price")),
                    str(p, "currency"),
                    toDouble(p.get("change")),
                    toDouble(p.get("changePercentage")),
                    toLong(p.get("volume")),
                    toLong(p.get("marketCap"))
            );
        } catch (Exception e) {
            return emptyQuote(ticker);
        }
    }

    @Cacheable(value = "fundamentals", unless = "#result.name() == null")
    public FundamentalsDto getFundamentals(String ticker) {
        try {
            Map<?, ?> p = fmp.getFirst("/profile?symbol=" + encode(ticker));
            if (p == null) return emptyFundamentals(ticker);

            String name = str(p, "companyName");
            String sector = str(p, "sector");
            String industry = str(p, "industry");
            String currency = str(p, "currency");
            if (currency == null) currency = deriveCurrency(ticker);
            String description = str(p, "description");
            boolean isEtf = Boolean.TRUE.equals(p.get("isEtf"));
            Long marketCap = toLong(p.get("marketCap"));

            // 52-week range from "low-high" string
            double[] range = parseRange(str(p, "range"));
            Double week52Low = range[0] > 0 ? range[0] : null;
            Double week52High = range[1] > 0 ? range[1] : null;

            // Key metrics TTM: pe, peg, eps, dividend (free for US, 402 for EU → null)
            Double peRatio = null, pegRatio = null, eps = null, dividendYield = null;
            try {
                Map<?, ?> km = fmp.getFirst("/key-metrics-ttm?symbol=" + encode(ticker));
                if (km != null) {
                    peRatio = toDouble(km.get("peRatioTTM"));
                    pegRatio = toDouble(km.get("pegRatioTTM"));
                    eps = toDouble(km.get("epsTTM"));
                    dividendYield = toDouble(km.get("dividendYieldTTM"));
                }
            } catch (Exception ignored) {}

            // Growth rates (free for US, 402 for EU → null)
            Double revenueGrowth = null, epsGrowth = null;
            try {
                Map<?, ?> growth = fmp.getFirst("/financial-growth?symbol=" + encode(ticker) + "&limit=1");
                if (growth != null) {
                    revenueGrowth = toDouble(growth.get("revenueGrowth"));
                    epsGrowth = toDouble(growth.get("epsgrowth"));
                }
            } catch (Exception ignored) {}

            // Dividend from lastDividend in profile if key-metrics unavailable
            if (dividendYield == null) {
                Double lastDiv = toDouble(p.get("lastDividend"));
                Double price = toDouble(p.get("price"));
                if (lastDiv != null && price != null && price > 0) {
                    dividendYield = lastDiv / price;
                }
            }

            String type = isEtf ? "etf" : "stock";
            String market = deriveMarket(currency);

            return new FundamentalsDto(ticker, name, sector, industry, currency, marketCap,
                    peRatio, null, pegRatio, eps, epsGrowth, revenueGrowth,
                    dividendYield, week52High, week52Low, type, market, description);
        } catch (Exception e) {
            return emptyFundamentals(ticker);
        }
    }

    @Cacheable(value = "search", unless = "#result.isEmpty()")
    public List<SearchResultDto> searchSuggestions(String query) {
        try {
            List<?> results = fmp.getList("/search-name?query=" + encode(query) + "&limit=6");
            if (results == null) return List.of();

            return results.stream()
                    .filter(r -> r instanceof Map<?, ?>)
                    .map(r -> (Map<?, ?>) r)
                    .map(r -> new SearchResultDto(
                            str(r, "symbol"),
                            str(r, "name") != null ? str(r, "name") : "",
                            "stock",
                            str(r, "exchangeShortName")
                    ))
                    .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    public String resolveIsin(String isin) {
        try {
            List<?> results = fmp.getList("/search-name?query=" + encode(isin) + "&limit=1");
            if (results == null || results.isEmpty()) return null;
            return str((Map<?, ?>) results.get(0), "symbol");
        } catch (Exception e) {
            return null;
        }
    }

    @Cacheable(value = "fx", unless = "#result == null")
    public Double getFxRate(String from, String to) {
        if (from.equals(to)) return 1.0;
        try {
            // profile for FX pair e.g. EURUSD
            Map<?, ?> p = fmp.getFirst("/profile?symbol=" + from + to);
            if (p != null && p.get("price") != null) return toDouble(p.get("price"));
            return 1.0;
        } catch (Exception e) {
            return 1.0;
        }
    }

    private double[] parseRange(String range) {
        if (range == null || range.isBlank()) return new double[]{0, 0};
        String[] parts = range.split("-");
        if (parts.length == 2) {
            try {
                return new double[]{Double.parseDouble(parts[0].trim()), Double.parseDouble(parts[1].trim())};
            } catch (NumberFormatException ignored) {}
        }
        return new double[]{0, 0};
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String str(Map<?, ?> map, String key) {
        Object v = map.get(key);
        return v instanceof String s ? s : null;
    }

    private Double toDouble(Object value) {
        if (value instanceof Number n) return n.doubleValue();
        return null;
    }

    private Long toLong(Object value) {
        if (value instanceof Number n) return n.longValue();
        return null;
    }

    private String deriveCurrency(String ticker) {
        if (ticker == null) return "USD";
        String t = ticker.toUpperCase();
        if (t.endsWith(".PA") || t.endsWith(".AS") || t.endsWith(".DE") ||
            t.endsWith(".MI") || t.endsWith(".MC") || t.endsWith(".BR")) return "EUR";
        if (t.endsWith(".L"))  return "GBP";
        if (t.endsWith(".SW")) return "CHF";
        return "USD";
    }

    private String deriveMarket(String currency) {
        if (currency == null) return "US";
        return switch (currency) {
            case "USD" -> "US";
            case "EUR", "GBP", "CHF", "SEK", "NOK", "DKK" -> "EU";
            default -> "WORLD";
        };
    }

    private QuoteDto emptyQuote(String ticker) {
        return new QuoteDto(ticker, null, null, null, null, null, null, null);
    }

    private FundamentalsDto emptyFundamentals(String ticker) {
        return new FundamentalsDto(ticker, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null);
    }
}
