package com.rojorabelisoa.finance.market;

import com.rojorabelisoa.finance.market.dto.CandleDto;
import com.rojorabelisoa.finance.market.dto.TechnicalAnalysisDto;
import com.rojorabelisoa.finance.market.dto.TechnicalAnalysisDto.FairValueGap;
import com.rojorabelisoa.finance.market.dto.TechnicalAnalysisDto.Level;
import com.rojorabelisoa.finance.market.dto.TechnicalAnalysisDto.LiquidityZone;
import com.rojorabelisoa.finance.market.dto.TechnicalAnalysisDto.OrderBlock;
import com.rojorabelisoa.finance.market.dto.TechnicalAnalysisDto.TradeSetup;
import com.rojorabelisoa.finance.shared.fmp.FmpClient;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Price-action analysis computed server-side from FMP end-of-day candles.
 *
 * <p>Pipeline: fetch OHLCV → swing pivots → clustered S/R levels, ICT order
 * blocks, fair value gaps, liquidity pools → trend → trade setups built from the
 * confluence of those structures.
 */
@Service
@RequiredArgsConstructor
public class TechnicalAnalysisService {

    private final FmpClient fmp;

    private static final int PIVOT_LOOKBACK = 3;
    private static final int ATR_PERIOD = 14;
    private static final double DISPLACEMENT_ATR = 1.5;

    @Cacheable(value = "technical", unless = "#result.candles().isEmpty()")
    public TechnicalAnalysisDto analyze(String ticker, int limit) {
        List<CandleDto> candles = fetchCandles(ticker, limit);
        if (candles.size() < 20) {
            return new TechnicalAnalysisDto(ticker, deriveCurrency(ticker), 0, "UNKNOWN", 0,
                    candles, List.of(), List.of(), List.of(), List.of(), List.of());
        }

        double atr = atr(candles, ATR_PERIOD);
        double lastPrice = candles.get(candles.size() - 1).close();
        double tolerance = Math.max(atr * 0.6, lastPrice * 0.006);

        int[] swingHighs = pivots(candles, PIVOT_LOOKBACK, true);
        int[] swingLows = pivots(candles, PIVOT_LOOKBACK, false);

        List<Level> levels = buildLevels(candles, swingHighs, swingLows, lastPrice, tolerance);
        List<OrderBlock> orderBlocks = findOrderBlocks(candles, atr);
        List<FairValueGap> fvgs = findFairValueGaps(candles, atr);
        List<LiquidityZone> liquidity = findLiquidity(candles, swingHighs, swingLows, tolerance);
        String trend = determineTrend(candles, swingHighs, swingLows);
        List<TradeSetup> setups = buildSetups(lastPrice, atr, trend, levels, orderBlocks, fvgs);

        return new TechnicalAnalysisDto(ticker, deriveCurrency(ticker), round(lastPrice), trend, round(atr),
                candles, levels, orderBlocks, fvgs, liquidity, setups);
    }

    // ---------------------------------------------------------------- data

    private List<CandleDto> fetchCandles(String ticker, int limit) {
        List<?> raw = fmp.getList("/historical-price-eod/full?symbol=" + encode(ticker));
        if (raw == null || raw.isEmpty()) return List.of();

        List<CandleDto> candles = new ArrayList<>();
        for (Object o : raw) {
            if (!(o instanceof Map<?, ?> m)) continue;
            String date = str(m, "date");
            Double open = toDouble(m.get("open"));
            Double high = toDouble(m.get("high"));
            Double low = toDouble(m.get("low"));
            Double close = toDouble(m.get("close"));
            if (date == null || open == null || high == null || low == null || close == null) continue;
            long time = epochMillis(date);
            long volume = toLong(m.get("volume"));
            candles.add(new CandleDto(date, time, open, high, low, close, volume));
        }
        // FMP returns most-recent-first; we want chronological order.
        candles.sort(Comparator.comparingLong(CandleDto::time));
        if (limit > 0 && candles.size() > limit) {
            return new ArrayList<>(candles.subList(candles.size() - limit, candles.size()));
        }
        return candles;
    }

    // ---------------------------------------------------------------- pivots

    /** Indices of swing highs (high=true) or swing lows (high=false) using a symmetric lookback. */
    private int[] pivots(List<CandleDto> c, int lookback, boolean high) {
        List<Integer> out = new ArrayList<>();
        for (int i = lookback; i < c.size() - lookback; i++) {
            double ref = high ? c.get(i).high() : c.get(i).low();
            boolean isPivot = true;
            for (int j = i - lookback; j <= i + lookback && isPivot; j++) {
                if (j == i) continue;
                double v = high ? c.get(j).high() : c.get(j).low();
                if (high ? v > ref : v < ref) isPivot = false;
            }
            if (isPivot) out.add(i);
        }
        return out.stream().mapToInt(Integer::intValue).toArray();
    }

    // ---------------------------------------------------------------- levels

    private List<Level> buildLevels(List<CandleDto> c, int[] highs, int[] lows,
                                     double lastPrice, double tolerance) {
        List<Double> prices = new ArrayList<>();
        for (int i : highs) prices.add(c.get(i).high());
        for (int i : lows) prices.add(c.get(i).low());
        prices.sort(Comparator.naturalOrder());

        List<double[]> clusters = new ArrayList<>(); // [sumPrice, count]
        for (double p : prices) {
            if (!clusters.isEmpty()) {
                double[] last = clusters.get(clusters.size() - 1);
                double avg = last[0] / last[1];
                if (Math.abs(p - avg) <= tolerance) {
                    last[0] += p;
                    last[1] += 1;
                    continue;
                }
            }
            clusters.add(new double[]{p, 1});
        }

        int maxTouches = clusters.stream().mapToInt(cl -> (int) cl[1]).max().orElse(1);
        List<Level> levels = new ArrayList<>();
        for (double[] cl : clusters) {
            int touches = (int) cl[1];
            if (touches < 2) continue; // keep only retested levels
            double price = cl[0] / cl[1];
            String type = price >= lastPrice ? "RESISTANCE" : "SUPPORT";
            double strength = (double) touches / maxTouches;
            levels.add(new Level(round(price), type, touches, round2(strength)));
        }
        levels.sort(Comparator.comparingInt(Level::touches).reversed());
        return levels.size() > 8 ? new ArrayList<>(levels.subList(0, 8)) : levels;
    }

    // ---------------------------------------------------------------- order blocks

    private List<OrderBlock> findOrderBlocks(List<CandleDto> c, double atr) {
        List<OrderBlock> out = new ArrayList<>();
        int n = c.size();
        for (int i = PIVOT_LOOKBACK; i < n - 3; i++) {
            CandleDto candle = c.get(i);
            boolean bearish = candle.close() < candle.open();
            boolean bullish = candle.close() > candle.open();

            double moveUp = maxHigh(c, i + 1, i + 3) - candle.close();
            double moveDown = candle.close() - minLow(c, i + 1, i + 3);

            if (bearish && moveUp > atr * DISPLACEMENT_ATR) {
                boolean mitigated = minLow(c, i + 4, n - 1) <= candle.high();
                out.add(new OrderBlock("BULLISH", round(candle.high()), round(candle.low()),
                        candle.date(), candle.time(), mitigated));
            } else if (bullish && moveDown > atr * DISPLACEMENT_ATR) {
                boolean mitigated = maxHigh(c, i + 4, n - 1) >= candle.low();
                out.add(new OrderBlock("BEARISH", round(candle.high()), round(candle.low()),
                        candle.date(), candle.time(), mitigated));
            }
        }
        // most recent first, capped
        out.sort(Comparator.comparingLong(OrderBlock::time).reversed());
        return out.size() > 10 ? new ArrayList<>(out.subList(0, 10)) : out;
    }

    // ---------------------------------------------------------------- fair value gaps

    private List<FairValueGap> findFairValueGaps(List<CandleDto> c, double atr) {
        List<FairValueGap> out = new ArrayList<>();
        int n = c.size();
        for (int i = 1; i < n - 1; i++) {
            CandleDto prev = c.get(i - 1);
            CandleDto next = c.get(i + 1);
            // Bullish FVG: gap between prev.high and next.low
            if (next.low() > prev.high() && (next.low() - prev.high()) > atr * 0.25) {
                double bottom = prev.high();
                double top = next.low();
                boolean filled = minLow(c, i + 2, n - 1) <= bottom;
                out.add(new FairValueGap("BULLISH", round(top), round(bottom),
                        c.get(i).date(), c.get(i).time(), filled));
            }
            // Bearish FVG: gap between next.high and prev.low
            else if (prev.low() > next.high() && (prev.low() - next.high()) > atr * 0.25) {
                double top = prev.low();
                double bottom = next.high();
                boolean filled = maxHigh(c, i + 2, n - 1) >= top;
                out.add(new FairValueGap("BEARISH", round(top), round(bottom),
                        c.get(i).date(), c.get(i).time(), filled));
            }
        }
        out.sort(Comparator.comparingLong(FairValueGap::time).reversed());
        return out.size() > 12 ? new ArrayList<>(out.subList(0, 12)) : out;
    }

    // ---------------------------------------------------------------- liquidity

    private List<LiquidityZone> findLiquidity(List<CandleDto> c, int[] highs, int[] lows, double tolerance) {
        List<LiquidityZone> out = new ArrayList<>();
        out.addAll(equalPivots(c, highs, tolerance, true));
        out.addAll(equalPivots(c, lows, tolerance, false));
        out.sort(Comparator.comparingLong(LiquidityZone::time).reversed());
        return out.size() > 8 ? new ArrayList<>(out.subList(0, 8)) : out;
    }

    private List<LiquidityZone> equalPivots(List<CandleDto> c, int[] idx, double tolerance, boolean high) {
        List<LiquidityZone> out = new ArrayList<>();
        for (int a = 0; a < idx.length; a++) {
            double priceA = high ? c.get(idx[a]).high() : c.get(idx[a]).low();
            int touches = 1;
            long time = c.get(idx[a]).time();
            String date = c.get(idx[a]).date();
            for (int b = a + 1; b < idx.length; b++) {
                double priceB = high ? c.get(idx[b]).high() : c.get(idx[b]).low();
                if (Math.abs(priceB - priceA) <= tolerance) {
                    touches++;
                    time = c.get(idx[b]).time();
                    date = c.get(idx[b]).date();
                }
            }
            if (touches >= 2) {
                out.add(new LiquidityZone(round(priceA), high ? "BUY_SIDE" : "SELL_SIDE", touches, date, time));
            }
        }
        return out;
    }

    // ---------------------------------------------------------------- trend

    private String determineTrend(List<CandleDto> c, int[] highs, int[] lows) {
        if (highs.length >= 2 && lows.length >= 2) {
            double h1 = c.get(highs[highs.length - 2]).high();
            double h2 = c.get(highs[highs.length - 1]).high();
            double l1 = c.get(lows[lows.length - 2]).low();
            double l2 = c.get(lows[lows.length - 1]).low();
            if (h2 > h1 && l2 > l1) return "UPTREND";
            if (h2 < h1 && l2 < l1) return "DOWNTREND";
        }
        double smaShort = sma(c, 20);
        double smaLong = sma(c, 50);
        if (smaShort > smaLong * 1.01) return "UPTREND";
        if (smaShort < smaLong * 0.99) return "DOWNTREND";
        return "RANGE";
    }

    // ---------------------------------------------------------------- setups

    private List<TradeSetup> buildSetups(double price, double atr, String trend,
                                         List<Level> levels, List<OrderBlock> obs, List<FairValueGap> fvgs) {
        List<TradeSetup> setups = new ArrayList<>();

        TradeSetup longSetup = buildLong(price, atr, trend, levels, obs, fvgs);
        if (longSetup != null) setups.add(longSetup);

        TradeSetup shortSetup = buildShort(price, atr, trend, levels, obs, fvgs);
        if (shortSetup != null) setups.add(shortSetup);

        return setups;
    }

    private TradeSetup buildLong(double price, double atr, String trend,
                                 List<Level> levels, List<OrderBlock> obs, List<FairValueGap> fvgs) {
        Double support = nearestBelow(levels, "SUPPORT", price);
        OrderBlock ob = obs.stream()
                .filter(o -> "BULLISH".equals(o.direction()) && !o.mitigated() && o.top() < price)
                .max(Comparator.comparingDouble(OrderBlock::top))
                .orElse(null);

        Double entry = ob != null ? ob.top() : support;
        if (entry == null) return null;

        Double resistance = nearestAbove(levels, "RESISTANCE", price);
        if (resistance == null) resistance = price + atr * 3;

        double stop = ob != null ? ob.bottom() - atr * 0.3 : entry - atr * 1.2;
        double risk = entry - stop;
        if (risk <= 0) return null;
        double reward = resistance - entry;
        double rr = reward / risk;
        if (rr < 1.0) return null;

        List<String> conf = new ArrayList<>();
        if (ob != null) conf.add("order block haussier non mitigé");
        if (support != null) conf.add(String.format("support à %.2f", support));
        boolean fvg = fvgs.stream().anyMatch(f -> "BULLISH".equals(f.direction()) && !f.filled());
        if (fvg) conf.add("FVG haussier non comblé");
        if ("UPTREND".equals(trend)) conf.add("tendance haussière");

        String confidence = conf.size() >= 3 ? "ÉLEVÉE" : conf.size() == 2 ? "MOYENNE" : "FAIBLE";
        String rationale = "Entrée longue sur " + String.join(", ", conf)
                + ". Invalidation sous le stop.";

        return new TradeSetup("LONG", round(entry), round(stop), round(resistance),
                round2(rr), confidence, rationale);
    }

    private TradeSetup buildShort(double price, double atr, String trend,
                                  List<Level> levels, List<OrderBlock> obs, List<FairValueGap> fvgs) {
        Double resistance = nearestAbove(levels, "RESISTANCE", price);
        OrderBlock ob = obs.stream()
                .filter(o -> "BEARISH".equals(o.direction()) && !o.mitigated() && o.bottom() > price)
                .min(Comparator.comparingDouble(OrderBlock::bottom))
                .orElse(null);

        Double entry = ob != null ? ob.bottom() : resistance;
        if (entry == null) return null;

        Double support = nearestBelow(levels, "SUPPORT", price);
        if (support == null) support = price - atr * 3;

        double stop = ob != null ? ob.top() + atr * 0.3 : entry + atr * 1.2;
        double risk = stop - entry;
        if (risk <= 0) return null;
        double reward = entry - support;
        double rr = reward / risk;
        if (rr < 1.0) return null;

        List<String> conf = new ArrayList<>();
        if (ob != null) conf.add("order block baissier non mitigé");
        if (resistance != null) conf.add(String.format("résistance à %.2f", resistance));
        boolean fvg = fvgs.stream().anyMatch(f -> "BEARISH".equals(f.direction()) && !f.filled());
        if (fvg) conf.add("FVG baissier non comblé");
        if ("DOWNTREND".equals(trend)) conf.add("tendance baissière");

        String confidence = conf.size() >= 3 ? "ÉLEVÉE" : conf.size() == 2 ? "MOYENNE" : "FAIBLE";
        String rationale = "Entrée vendeuse sur " + String.join(", ", conf)
                + ". Invalidation au-dessus du stop.";

        return new TradeSetup("SHORT", round(entry), round(stop), round(support),
                round2(rr), confidence, rationale);
    }

    // ---------------------------------------------------------------- helpers

    private Double nearestBelow(List<Level> levels, String type, double price) {
        return levels.stream()
                .filter(l -> l.type().equals(type) && l.price() < price)
                .map(Level::price)
                .max(Comparator.naturalOrder())
                .orElse(null);
    }

    private Double nearestAbove(List<Level> levels, String type, double price) {
        return levels.stream()
                .filter(l -> l.type().equals(type) && l.price() > price)
                .map(Level::price)
                .min(Comparator.naturalOrder())
                .orElse(null);
    }

    private double maxHigh(List<CandleDto> c, int from, int to) {
        double max = Double.NEGATIVE_INFINITY;
        for (int i = Math.max(0, from); i <= Math.min(c.size() - 1, to); i++) {
            max = Math.max(max, c.get(i).high());
        }
        return max == Double.NEGATIVE_INFINITY ? 0 : max;
    }

    private double minLow(List<CandleDto> c, int from, int to) {
        double min = Double.POSITIVE_INFINITY;
        for (int i = Math.max(0, from); i <= Math.min(c.size() - 1, to); i++) {
            min = Math.min(min, c.get(i).low());
        }
        return min == Double.POSITIVE_INFINITY ? 0 : min;
    }

    private double atr(List<CandleDto> c, int period) {
        int n = c.size();
        int start = Math.max(1, n - period);
        double sum = 0;
        int count = 0;
        for (int i = start; i < n; i++) {
            double high = c.get(i).high();
            double low = c.get(i).low();
            double prevClose = c.get(i - 1).close();
            double tr = Math.max(high - low, Math.max(Math.abs(high - prevClose), Math.abs(low - prevClose)));
            sum += tr;
            count++;
        }
        return count == 0 ? 0 : sum / count;
    }

    private double sma(List<CandleDto> c, int period) {
        int n = c.size();
        int start = Math.max(0, n - period);
        double sum = 0;
        int count = 0;
        for (int i = start; i < n; i++) {
            sum += c.get(i).close();
            count++;
        }
        return count == 0 ? 0 : sum / count;
    }

    private long epochMillis(String date) {
        try {
            return LocalDate.parse(date.substring(0, 10)).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli();
        } catch (Exception e) {
            return 0L;
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

    private long toLong(Object value) {
        if (value instanceof Number n) return n.longValue();
        return 0L;
    }

    private String deriveCurrency(String ticker) {
        if (ticker == null) return "USD";
        String t = ticker.toUpperCase();
        if (t.endsWith(".PA") || t.endsWith(".AS") || t.endsWith(".DE") ||
                t.endsWith(".MI") || t.endsWith(".MC") || t.endsWith(".BR")) return "EUR";
        if (t.endsWith(".L")) return "GBP";
        if (t.endsWith(".SW")) return "CHF";
        return "USD";
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
