package com.rojorabelisoa.finance.market.dto;

public record SearchResultDto(
        String symbol,
        String name,
        String type,    // "stock" ou "etf"
        String exchange
) {}
