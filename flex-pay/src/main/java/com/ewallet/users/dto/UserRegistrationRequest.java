package com.ewallet.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserRegistrationRequest(
    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must be 100 characters or fewer")
    String fullName,

    @NotBlank(message = "Phone is required")
    @Size(max = 20, message = "Phone must be 20 characters or fewer")
    String phone,

    @Size(max = 150, message = "Email must be 150 characters or fewer")
    @Email(message = "Email must be valid")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    String password
) {
}
