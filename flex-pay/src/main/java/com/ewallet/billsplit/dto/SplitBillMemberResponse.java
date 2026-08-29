package com.ewallet.billsplit.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SplitBillMemberResponse(
    Long id,
    Long userId,
    String name,
    String phoneNumber,
    String email,
    String avatar,
    BigDecimal amount,
    String status,
    LocalDateTime paidAt,
    Boolean isCreator
) {
}
