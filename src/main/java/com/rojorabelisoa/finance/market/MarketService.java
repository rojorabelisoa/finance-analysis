package com.rojorabelisoa.finance.market;

import com.rojorabelisoa.finance.market.dto.FundamentalsDto;
import com.rojorabelisoa.finance.market.dto.QuoteDto;
import com.rojorabelisoa.finance.market.dto.SearchResultDto;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MarketService {

    private final WebClient yahooClient;

    @Cacheable("quotes")
    public QuoteDto getQuote(String ticker) {
        try {
            Map<?, ?> body = yahooClient.get()
                    .uri("/v8/finance/chart/{ticker}?interval=1d&range=1d", ticker)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (body == null) return emptyQuote(ticker);

            Map<?, ?> chart = (Map<?, ?>) body.get("chart");
            if (chart == null) return emptyQuote(ticker);

            List<?> results = (List<?>) chart.get("result");
            if (results == null || results.isEmpty()) return emptyQuote(ticker);

            Map<?, ?> result = (Map<?, ?>) results.get(0);
            Map<?, ?> meta = (Map<?, ?>) result.get("meta");
            if (meta == null) return emptyQuote(ticker);

            Double price = toDouble(meta.get("regularMarketPrice"));
            String currency = (String) meta.get("currency");
            String symbol = (String) meta.get("symbol");
            String name = (String) meta.get("longName");
            Double changePercent = toDouble(meta.get("regularMarketChangePercent"));
            Double change = price != null && changePercent != null
                    ? price - price / (1 + changePercent / 100)
                    : null;
            Long volume = toLong(meta.get("regularMarketVolume"));
            Long marketCap = toLong(meta.get("marketCap"));

            return new QuoteDto(symbol, name, price, currency, change, changePercent, volume, marketCap);
        } catch (Exception e) {
            return emptyQuote(ticker);
        }
    }

    @Cacheable("fundamentals")
    public FundamentalsDto getFundamentals(String ticker) {
        try {
            Map<?, ?> body = yahooClient.get()
                    .uri("/v10/finance/quoteSummary/{ticker}?modules=summaryDetail,defaultKeyStatistics,financialData,assetProfile,quoteType", ticker)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (body == null) return emptyFundamentals(ticker);

            Map<?, ?> quoteSummary = (Map<?, ?>) body.get("quoteSummary");
            if (quoteSummary == null) return emptyFundamentals(ticker);

            List<?> results = (List<?>) quoteSummary.get("result");
            if (results == null || results.isEmpty()) return emptyFundamentals(ticker);

            Map<?, ?> result = (Map<?, ?>) results.get(0);

            Map<?, ?> summaryDetail = (Map<?, ?>) result.get("summaryDetail");
            Map<?, ?> keyStats = (Map<?, ?>) result.get("defaultKeyStatistics");
            Map<?, ?> financialData = (Map<?, ?>) result.get("financialData");
            Map<?, ?> assetProfile = (Map<?, ?>) result.get("assetProfile");
            Map<?, ?> quoteTypeModule = (Map<?, ?>) result.get("quoteType");

            Double trailingPe = extractRaw(summaryDetail, "trailingPE");
            Double forwardPe = extractRaw(summaryDetail, "forwardPE");
            Double dividendYield = extractRaw(summaryDetail, "dividendYield");
            Double week52High = extractRaw(summaryDetail, "fiftyTwoWeekHigh");
            Double week52Low = extractRaw(summaryDetail, "fiftyTwoWeekLow");
            Long marketCap = extractRawLong(summaryDetail, "marketCap");

            Double pegRatio = extractRaw(keyStats, "pegRatio");
            Double eps = extractRaw(keyStats, "trailingEps");
            Double epsGrowth = extractRaw(keyStats, "earningsGrowth");
            Double revenueGrowth = extractRaw(financialData, "revenueGrowth");

            String name = assetProfile != null ? (String) assetProfile.get("longName") : null;
            String sector = assetProfile != null ? (String) assetProfile.get("sector") : null;
            String industry = assetProfile != null ? (String) assetProfile.get("industry") : null;
            String description = assetProfile != null ? (String) assetProfile.get("longBusinessSummary") : null;

            String currency = summaryDetail != null ? (String) summaryDetail.get("currency") : null;

            String rawQuoteType = quoteTypeModule != null ? (String) quoteTypeModule.get("quoteType") : "EQUITY";
            String type = deriveType(rawQuoteType);
            String market = deriveMarket(currency);

            return new FundamentalsDto(
                    ticker, name, sector, industry, currency, marketCap,
                    trailingPe, forwardPe, pegRatio, eps, epsGrowth, revenueGrowth,
                    dividendYield, week52High, week52Low, type, market, description
            );
        } catch (Exception e) {
            return emptyFundamentals(ticker);
        }
    }

    @Cacheable("search")
    public List<SearchResultDto> searchSuggestions(String query) {
        try {
            // Si ISIN, résoudre d'abord
            String searchQuery = query;
            if (query.matches("[A-Z]{2}[A-Z0-9]{10}")) {
                String resolved = resolveIsin(query);
                if (resolved != null) searchQuery = resolved;
            }

            Map<?, ?> body = yahooClient.get()
                    .uri("/v1/finance/search?q={q}&quotesCount=8&newsCount=0&enableFuzzyQuery=true", searchQuery)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (body == null) return List.of();

            List<?> quotes = (List<?>) body.get("quotes");
            if (quotes == null) return List.of();

            return quotes.stream()
                    .filter(q -> q instanceof Map<?, ?>)
                    .map(q -> (Map<?, ?>) q)
                    .filter(q -> {
                        String type = (String) ((Map<?, ?>) q).get("quoteType");
                        return type != null && (type.equals("EQUITY") || type.equals("ETF") || type.equals("MUTUALFUND"));
                    })
                    .map(q -> {
                        Map<?, ?> m = (Map<?, ?>) q;
                        String name = m.get("longname") != null ? (String) m.get("longname") : (String) m.get("shortname");
                        return new SearchResultDto(
                                (String) m.get("symbol"),
                                name != null ? name : "",
                                deriveType((String) m.get("quoteType")),
                                (String) m.get("exchange")
                        );
                    })
                    .limit(6)
                    .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    @Cacheable("search")
    public String resolveIsin(String isin) {
        try {
            Map<?, ?> body = yahooClient.get()
                    .uri("/v1/finance/search?q={isin}&quotesCount=1&newsCount=0&enableFuzzyQuery=false", isin)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (body == null) return null;

            Map<?, ?> finance = (Map<?, ?>) body.get("finance");
            if (finance != null) {
                List<?> results = (List<?>) finance.get("result");
                if (results != null && !results.isEmpty()) {
                    Map<?, ?> first = (Map<?, ?>) results.get(0);
                    return (String) first.get("symbol");
                }
            }

            List<?> quotes = (List<?>) body.get("quotes");
            if (quotes != null && !quotes.isEmpty()) {
                Map<?, ?> first = (Map<?, ?>) quotes.get(0);
                return (String) first.get("symbol");
            }

            return null;
        } catch (Exception e) {
            return null;
        }
    }

    @Cacheable("fx")
    public Double getFxRate(String from, String to) {
        if (from.equals(to)) return 1.0;
        try {
            Double price = getQuote(from + to + "=X").price();
            return price != null ? price : 1.0;
        } catch (Exception e) {
            return 1.0;
        }
    }

    private Double toDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.doubleValue();
        return null;
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.longValue();
        return null;
    }

    private Double extractRaw(Map<?, ?> module, String key) {
        if (module == null) return null;
        Object field = module.get(key);
        if (field instanceof Map<?, ?> m) return toDouble(m.get("raw"));
        return toDouble(field);
    }

    private Long extractRawLong(Map<?, ?> module, String key) {
        if (module == null) return null;
        Object field = module.get(key);
        if (field instanceof Map<?, ?> m) return toLong(m.get("raw"));
        return toLong(field);
    }

    private String deriveType(String quoteType) {
        if (quoteType == null) return "stock";
        return switch (quoteType.toUpperCase()) {
            case "ETF", "MUTUALFUND" -> "etf";
            default -> "stock";
        };
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
