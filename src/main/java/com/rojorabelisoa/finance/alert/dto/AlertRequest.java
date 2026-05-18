package com.rojorabelisoa.finance.alert.dto;

public record AlertRequest(
        String ticker,
        String alertType,
        Double threshold
) {}
