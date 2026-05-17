package com.rojorabelisoa.finance.market.dto;

public record QuoteDto(
        String ticker,
        String name,
        Double price,
        String currency,
        Double change,
        Double changePercent,
        Long volume,
        Long marketCap
) {
}
