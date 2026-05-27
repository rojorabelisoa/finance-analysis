package com.rojorabelisoa.finance.market.dto;

/** A single OHLCV candle. {@code time} is epoch millis (UTC midnight for daily data). */
public record CandleDto(
        String date,
        long time,
        double open,
        double high,
        double low,
        double close,
        long volume
) {}
