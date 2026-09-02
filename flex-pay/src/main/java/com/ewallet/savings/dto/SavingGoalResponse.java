package com.ewallet.savings.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingGoalResponse {

    private Long id;
    private String name;
    private String icon;
    private String category;
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private Double progress;
    private BigDecimal remainingAmount;
    private LocalDate targetDate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
