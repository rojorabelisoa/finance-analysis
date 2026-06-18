package com.rojorabelisoa.finance.settings.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

public record UserSettingsDto(
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate peaOpeningDate,
        String allocationTargetsJson
) {}
