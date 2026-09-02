package com.ewallet.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatPaymentResponse {

    private Long paymentId;
    private BigDecimal amount;
    private String status;
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private String receiverName;
    private String transactionReference;
    private String message;
    private BigDecimal newSenderBalance;
    private LocalDateTime completedAt;
}
