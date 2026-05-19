package com.rojorabelisoa.finance.portfolio.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

public record SnapshotDto(
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate date,
        Double invested
) {}
