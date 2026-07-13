package com.ewallet.payment.dto;

import java.math.BigDecimal;

public record SendMoneyResponse(
    String transactionReference,
    BigDecimal senderBalance,
    BigDecimal receiverBalance,
    String status
) {
}
