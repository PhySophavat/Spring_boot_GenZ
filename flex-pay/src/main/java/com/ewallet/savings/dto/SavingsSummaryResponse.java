package com.ewallet.savings.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingsSummaryResponse {

    private BigDecimal totalSavings;
    private BigDecimal mainWalletBalance;
    private Long activeGoalsCount;
    private Long completedGoalsCount;
    private Integer currentStreak;
    private Integer bestStreak;
}
