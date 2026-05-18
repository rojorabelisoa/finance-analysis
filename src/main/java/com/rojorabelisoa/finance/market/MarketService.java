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
                    .uri("/v7/finance/quote?symbols={ticker}", ticker)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (body == null) return emptyQuote(ticker);
            Map<?, ?> quoteResponse = (Map<?, ?>) body.get("quoteResponse");
            if (quoteResponse == null) return emptyQuote(ticker);
            List<?> results = (List<?>) quoteResponse.get("result");
            if (results == null || results.isEmpty()) return emptyQuote(ticker);

            Map<?, ?> q = (Map<?, ?>) results.get(0);
            String symbol = (String) q.get("symbol");
            String name = q.get("longName") != null ? (String) q.get("longName") : (String) q.get("shortName");
            Double price = toDouble(q.get("regularMarketPrice"));
            String currency = (String) q.get("currency");
            Double change = toDouble(q.get("regularMarketChange"));
            Double changePercent = toDouble(q.get("regularMarketChangePercent"));
            Long volume = toLong(q.get("regularMarketVolume"));
            Long marketCap = toLong(q.get("marketCap"));

            return new QuoteDto(symbol, name, price, currency, change, changePercent, volume, marketCap);
        } catch (Exception e) {
            return emptyQuote(ticker);
        }
    }

    @Cacheable("fundamentals")
    public FundamentalsDto getFundamentals(String ticker) {
        try {
            // Données principales via v7/finance/quote (fiable, flat JSON)
            Map<?, ?> body = yahooClient.get()
                    .uri("/v7/finance/quote?symbols={ticker}", ticker)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (body == null) return emptyFundamentals(ticker);
            Map<?, ?> quoteResponse = (Map<?, ?>) body.get("quoteResponse");
            if (quoteResponse == null) return emptyFundamentals(ticker);
            List<?> results = (List<?>) quoteResponse.get("result");
            if (results == null || results.isEmpty()) return emptyFundamentals(ticker);

            Map<?, ?> q = (Map<?, ?>) results.get(0);

            String name = q.get("longName") != null ? (String) q.get("longName") : (String) q.get("shortName");
            String sector = (String) q.get("sector");
            String industry = (String) q.get("industry");
            String currency = (String) q.get("currency");
            String quoteType = (String) q.get("quoteType");

            Double trailingPe = toDouble(q.get("trailingPE"));
            Double forwardPe = toDouble(q.get("forwardPE"));
            Double pegRatio = toDouble(q.get("pegRatio"));
            Double eps = toDouble(q.get("epsTrailingTwelveMonths"));
            Double epsGrowth = toDouble(q.get("earningsGrowth"));
            Double revenueGrowth = toDouble(q.get("revenueGrowth"));
            Double dividendYield = toDouble(q.get("dividendYield"));
            Double week52High = toDouble(q.get("fiftyTwoWeekHigh"));
            Double week52Low = toDouble(q.get("fiftyTwoWeekLow"));
            Long marketCap = toLong(q.get("marketCap"));

            String type = deriveType(quoteType);
            String market = deriveMarket(currency);

            // Description via quoteSummary (optionnel, ne bloque pas si échoue)
            String description = null;
            try {
                Map<?, ?> summaryBody = yahooClient.get()
                        .uri("/v10/finance/quoteSummary/{ticker}?modules=assetProfile", ticker)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block();
                if (summaryBody != null) {
                    Map<?, ?> qs = (Map<?, ?>) summaryBody.get("quoteSummary");
                    if (qs != null) {
                        List<?> sr = (List<?>) qs.get("result");
                        if (sr != null && !sr.isEmpty()) {
                            Map<?, ?> ap = (Map<?, ?>) ((Map<?, ?>) sr.get(0)).get("assetProfile");
                            if (ap != null) description = (String) ap.get("longBusinessSummary");
                        }
                    }
                }
            } catch (Exception ignored) {}

            return new FundamentalsDto(ticker, name, sector, industry, currency, marketCap,
                    trailingPe, forwardPe, pegRatio, eps, epsGrowth, revenueGrowth,
                    dividendYield, week52High, week52Low, type, market, description);
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
