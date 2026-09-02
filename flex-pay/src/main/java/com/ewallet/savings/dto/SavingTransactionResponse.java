package com.ewallet.savings.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingTransactionResponse {

    private Long id;
    private Long goalId;
    private String goalName;
    private BigDecimal amount;
    private String type; // ADD, WITHDRAW
    private String note;
    private LocalDateTime createdAt;
}
