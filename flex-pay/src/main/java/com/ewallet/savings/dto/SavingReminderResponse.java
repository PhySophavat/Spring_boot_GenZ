package com.ewallet.savings.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingReminderResponse {

    private Long id;
    private Long goalId;
    private String frequency;
    private BigDecimal amount;
    private String reminderTime;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
