package com.ewallet.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    String email,

    @JsonAlias({"token", "reset_token"})
    String resetToken,

    @JsonAlias({"code", "otpCode"})
    String otp,

    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    String newPassword,

    String confirmPassword
) {
    public String effectiveConfirmPassword() {
        return (confirmPassword != null && !confirmPassword.isBlank()) ? confirmPassword : newPassword;
    }
}
