package com.rojorabelisoa.finance.market.dto;

import java.util.List;

/**
 * Result of a technical / price-action analysis: the candles plus the detected
 * structures (support/resistance, ICT order blocks, fair value gaps, liquidity)
 * and the resulting trade setups.
 */
public record TechnicalAnalysisDto(
        String ticker,
        String currency,
        double lastPrice,
        String trend,
        double atr,
        List<CandleDto> candles,
        List<Level> levels,
        List<OrderBlock> orderBlocks,
        List<FairValueGap> fairValueGaps,
        List<LiquidityZone> liquidityZones,
        List<TradeSetup> setups
) {
    /** Horizontal support or resistance built from clustered swing pivots. */
    public record Level(double price, String type, int touches, double strength) {}

    /** ICT order block: the last opposite candle before an impulsive move. */
    public record OrderBlock(String direction, double top, double bottom, String date, long time, boolean mitigated) {}

    /** Three-candle imbalance (fair value gap / FVG). */
    public record FairValueGap(String direction, double top, double bottom, String date, long time, boolean filled) {}

    /** Resting liquidity above equal highs (buy-side) or below equal lows (sell-side). */
    public record LiquidityZone(double price, String type, int touches, String date, long time) {}

    /** A potential entry with stop loss, take profit and the confluence behind it. */
    public record TradeSetup(
            String direction,
            double entry,
            double stopLoss,
            double takeProfit,
            double riskReward,
            String confidence,
            String rationale
    ) {}
}
