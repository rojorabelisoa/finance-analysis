package com.rojorabelisoa.finance.portfolio.dto;

public record PositionResponse(
        Long id,
        String ticker,
        String name,
        String type,
        String market,
        String sector,
        Double shares,
        Double avgPrice,
        String currency,
        String buyDate,
        String notes,
        String createdAt
) {
}
