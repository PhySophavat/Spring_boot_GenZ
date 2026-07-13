package com.ewallet.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ChangePinRequest(
    @NotBlank(message = "Current PIN is required")
    @Pattern(regexp = "^\\d{6}$", message = "PIN must be exactly 6 digits and numeric only")
    String currentPin,

    @NotBlank(message = "New PIN is required")
    @Pattern(regexp = "^\\d{6}$", message = "PIN must be exactly 6 digits and numeric only")
    String newPin,

    @NotBlank(message = "Confirm PIN is required")
    String confirmPin
) {
}
