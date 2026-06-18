package com.rojorabelisoa.finance.settings.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

public record PeaInfoDto(
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate openingDate,
        Long daysOpen,
        Double yearsOpen,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate fiveYearDate,
        Long daysToFiveYears,
        Boolean hasReachedFiveYears,
        Double currentTaxRate,
        Double socialChargesRate,
        Long maxContributionRemaining
) {}
