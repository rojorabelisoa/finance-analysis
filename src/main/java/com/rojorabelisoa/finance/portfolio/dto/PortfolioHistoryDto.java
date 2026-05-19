package com.rojorabelisoa.finance.portfolio.dto;

import java.util.List;

public record PortfolioHistoryDto(
        List<SnapshotDto> snapshots,
        Double totalInvested,
        Double totalCurrentValue  // null, filled by frontend with live prices
) {}
