package com.ewallet.billsplit.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record SplitBillResponse(
    Long id,
    Map<String, Object> creator,
    BigDecimal totalAmount,
    String currency,
    String note,
    String splitType,
    String status,
    BigDecimal creatorPaidAmount,
    BigDecimal totalToCollect,
    BigDecimal collectedAmount,
    Double progressPercentage,
    List<SplitBillMemberResponse> members,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
