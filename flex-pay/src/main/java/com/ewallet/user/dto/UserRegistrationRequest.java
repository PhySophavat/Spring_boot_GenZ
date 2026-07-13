package com.ewallet.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserRegistrationRequest(
    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must be 100 characters or fewer")
    String fullName,

    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number must be 20 characters or fewer")
    String phoneNumber,

    @Size(max = 150, message = "Email must be 150 characters or fewer")
    @Email(message = "Email must be valid")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    String password,

    @NotBlank(message = "Confirm password is required")
    String confirmPassword
) {
}
