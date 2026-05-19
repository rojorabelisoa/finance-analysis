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
            // stable: /quote?symbol=AAPL
            Map<?, ?> q = fmp.getFirst("/quote?symbol=" + encode(ticker));
            if (q == null) return emptyQuote(ticker);

            return new QuoteDto(
                    str(q, "symbol"),
                    str(q, "name"),
                    toDouble(q.get("price")),
                    str(q, "currency"),
                    toDouble(q.get("change")),
                    toDouble(q.get("changesPercentage")),
                    toLong(q.get("volume")),
                    toLong(q.get("marketCap"))
            );
        } catch (Exception e) {
            return emptyQuote(ticker);
        }
    }

    @Cacheable(value = "fundamentals", unless = "#result.name() == null")
    public FundamentalsDto getFundamentals(String ticker) {
        try {
            // Quote for price + pe + eps + 52w
            Map<?, ?> quote = fmp.getFirst("/quote?symbol=" + encode(ticker));
            if (quote == null) return emptyFundamentals(ticker);

            // Profile for sector / industry / description / isEtf
            Map<?, ?> profile = fmp.getFirst("/profile?symbol=" + encode(ticker));

            String name = profile != null ? str(profile, "companyName") : str(quote, "name");
            String sector = profile != null ? str(profile, "sector") : null;
            String industry = profile != null ? str(profile, "industry") : null;
            String currency = str(quote, "currency");
            if (currency == null && profile != null) currency = str(profile, "currency");
            String description = profile != null ? str(profile, "description") : null;
            boolean isEtf = profile != null && Boolean.TRUE.equals(profile.get("isEtf"));
            Long marketCap = toLong(quote.get("marketCap"));
            if (marketCap == null && profile != null) marketCap = toLong(profile.get("mktCap"));

            Double peRatio = toDouble(quote.get("pe"));
            Double eps = toDouble(quote.get("eps"));
            Double week52High = toDouble(quote.get("yearHigh"));
            Double week52Low = toDouble(quote.get("yearLow"));

            // Key metrics TTM for PEG + dividend
            Double pegRatio = null;
            Double dividendYield = null;
            try {
                Map<?, ?> km = fmp.getFirst("/key-metrics-ttm?symbol=" + encode(ticker));
                if (km != null) {
                    pegRatio = toDouble(km.get("pegRatioTTM"));
                    dividendYield = toDouble(km.get("dividendYieldTTM"));
                }
            } catch (Exception ignored) {}

            // Growth rates
            Double revenueGrowth = null;
            Double epsGrowth = null;
            try {
                Map<?, ?> growth = fmp.getFirst("/financial-growth?symbol=" + encode(ticker) + "&limit=1");
                if (growth != null) {
                    revenueGrowth = toDouble(growth.get("revenueGrowth"));
                    epsGrowth = toDouble(growth.get("epsgrowth"));
                }
            } catch (Exception ignored) {}

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
            // stable: /search-name?query=Apple&limit=8
            List<?> results = fmp.getList("/search-name?query=" + encode(query) + "&limit=8");
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
                    .limit(6)
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
            // FX pair quote e.g. EURUSD
            Map<?, ?> q = fmp.getFirst("/quote?symbol=" + from + to);
            if (q != null && q.get("price") != null) return toDouble(q.get("price"));
            return 1.0;
        } catch (Exception e) {
            return 1.0;
        }
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
