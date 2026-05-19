package com.rojorabelisoa.finance.screener;

import com.rojorabelisoa.finance.screener.dto.ScreenerResultDto;
import com.rojorabelisoa.finance.shared.fmp.FmpClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScreenerService {

    private static final int BATCH_SIZE = 100;

    private final FmpClient fmp;

    @Cacheable(value = "screener", key = "'all'")
    public List<ScreenerResultDto> fetchAll() {
        List<String> tickers = loadTickers();
        List<ScreenerResultDto> results = new ArrayList<>();
        for (int i = 0; i < tickers.size(); i += BATCH_SIZE) {
            List<String> batch = tickers.subList(i, Math.min(i + BATCH_SIZE, tickers.size()));
            results.addAll(fetchBatch(batch));
        }
        return results;
    }

    public List<ScreenerResultDto> screen(Double peMax, Double revenueGrowthMin, Double epsGrowthMin,
                                           int page, int size) {
        return fetchAll().stream()
                .filter(r -> r.peRatio() != null && (peMax == null || r.peRatio() <= peMax))
                .filter(r -> revenueGrowthMin == null || (r.revenueGrowth() != null && r.revenueGrowth() >= revenueGrowthMin))
                .filter(r -> epsGrowthMin == null || (r.epsGrowth() != null && r.epsGrowth() >= epsGrowthMin))
                .sorted((a, b) -> Double.compare(
                        a.peRatio() != null ? a.peRatio() : Double.MAX_VALUE,
                        b.peRatio() != null ? b.peRatio() : Double.MAX_VALUE))
                .skip((long) page * size)
                .limit(size)
                .collect(Collectors.toList());
    }

    public long countScreened(Double peMax, Double revenueGrowthMin, Double epsGrowthMin) {
        return fetchAll().stream()
                .filter(r -> r.peRatio() != null && (peMax == null || r.peRatio() <= peMax))
                .filter(r -> revenueGrowthMin == null || (r.revenueGrowth() != null && r.revenueGrowth() >= revenueGrowthMin))
                .filter(r -> epsGrowthMin == null || (r.epsGrowth() != null && r.epsGrowth() >= epsGrowthMin))
                .count();
    }

    public ScreenerResultDto getQuoteForAlert(String ticker) {
        List<ScreenerResultDto> result = fetchBatch(List.of(ticker));
        return result.isEmpty() ? null : result.get(0);
    }

    private List<ScreenerResultDto> fetchBatch(List<String> tickers) {
        try {
            String symbols = String.join(",", tickers);
            // FMP batch quote: /api/v3/quote/AAPL,MSFT,...
            List<?> results = fmp.getList("/v3/quote/" + symbols);
            if (results == null) return List.of();

            return results.stream()
                    .filter(r -> r instanceof Map<?, ?>)
                    .map(r -> (Map<?, ?>) r)
                    .map(r -> new ScreenerResultDto(
                            str(r, "symbol"),
                            str(r, "name"),
                            toDouble(r.get("price")),
                            str(r, "currency"),
                            toDouble(r.get("pe")),
                            null,  // revenueGrowth not in batch quote — needs separate call
                            null,  // epsGrowth not in batch quote
                            toLong(r.get("marketCap"))
                    ))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Screener batch failed: {}", e.getMessage());
            return List.of();
        }
    }

    private List<String> loadTickers() {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new ClassPathResource("sp500.txt").getInputStream()))) {
            return reader.lines()
                    .map(String::trim)
                    .filter(l -> !l.isBlank())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to load sp500.txt: {}", e.getMessage());
            return List.of();
        }
    }

    private String str(Map<?, ?> map, String key) {
        Object v = map.get(key);
        return v instanceof String s ? s : null;
    }

    private Double toDouble(Object v) {
        if (v instanceof Number n) return n.doubleValue();
        return null;
    }

    private Long toLong(Object v) {
        if (v instanceof Number n) return n.longValue();
        return null;
    }
}
