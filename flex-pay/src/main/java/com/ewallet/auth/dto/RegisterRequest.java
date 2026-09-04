package com.ewallet.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must be 100 characters or fewer")
    String fullName,

    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number must be 20 characters or fewer")
    String phoneNumber,

    @Email(message = "Email must be valid")
    @Size(max = 150, message = "Email must be 150 characters or fewer")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    String password,

    @NotBlank(message = "Confirm password is required")
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

    public String getEmail() {
        return email;
    }
}
