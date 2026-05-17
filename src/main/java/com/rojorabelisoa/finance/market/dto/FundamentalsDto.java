package com.rojorabelisoa.finance.market.dto;

public record FundamentalsDto(
        String ticker,
        String name,
        String sector,
        String industry,
        String currency,
        Long marketCap,
        Double peRatio,
        Double forwardPe,
        Double pegRatio,
        Double eps,
        Double epsGrowth,
        Double revenueGrowth,
        Double dividendYield,
        Double week52High,
        Double week52Low,
        String description
) {
}
