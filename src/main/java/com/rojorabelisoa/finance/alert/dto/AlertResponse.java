package com.rojorabelisoa.finance.alert.dto;

public record AlertResponse(
        Long id,
        String ticker,
        String alertType,
        Double threshold,
        boolean active,
        String triggeredAt,
        String createdAt
) {}
