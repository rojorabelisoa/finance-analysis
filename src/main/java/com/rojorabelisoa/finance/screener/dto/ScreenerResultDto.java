package com.rojorabelisoa.finance.screener.dto;

public record ScreenerResultDto(
        String ticker,
        String name,
        Double price,
        String currency,
        Double peRatio,
        Double revenueGrowth,
        Double epsGrowth,
        Long marketCap
) {}
