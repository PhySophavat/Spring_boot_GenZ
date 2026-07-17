package com.ewallet.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionResponse(
    Long id,
    String referenceNumber,
    String senderWalletNumber,
    String senderName,
    String receiverWalletNumber,
    String receiverName,
    BigDecimal amount,
    BigDecimal fee,
    BigDecimal totalAmount,
    String note,
    String transactionType,
    String currency,
    String status,
    LocalDateTime createdAt
) {
}
