package com.ewallet.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @JsonAlias({"name", "fullName"})
    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must be 100 characters or fewer")
    String fullName,

    @JsonAlias({"phone", "phoneNumber"})
    String phoneNumber,

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 150, message = "Email must be 150 characters or fewer")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    String password,

    String confirmPassword,

    String otp
) {
    public RegisterRequest(
        String fullName,
        String phoneNumber,
        String email,
        String password,
        String confirmPassword
    ) {
        this(fullName, phoneNumber, email, password, confirmPassword, null);
    }

    public String effectiveConfirmPassword() {
        return (confirmPassword != null && !confirmPassword.isBlank()) ? confirmPassword : password;
    }

    public String effectivePhoneNumber() {
        if (phoneNumber != null && !phoneNumber.isBlank()) {
            return phoneNumber.trim();
        }
        // Fallback synthetic phone number if user signs up with email only
        long hash = Math.abs((long) email.hashCode() % 900000000L);
        return "0" + String.format("%09d", hash + 100000000L);
    }

    public String getEmail() {
        return email;
    }
}
