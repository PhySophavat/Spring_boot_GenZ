package com.ewallet.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResetPinRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Reset token is required")
    @JsonAlias({"token", "reset_token"})
    String resetToken,

    @NotBlank(message = "New PIN is required")
    @Pattern(regexp = "^\\d{6}$", message = "PIN must be exactly 6 digits and numeric only")
    @JsonAlias({"pin", "new_pin"})
    String newPin
) {
}
