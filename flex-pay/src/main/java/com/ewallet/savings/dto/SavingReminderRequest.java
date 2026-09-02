package com.ewallet.savings.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingReminderRequest {

    @NotBlank(message = "Frequency is required")
    private String frequency; // DAILY, WEEKLY, MONTHLY

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "Reminder time is required")
    private String reminderTime;

    @Builder.Default
    private Boolean enabled = true;
}
