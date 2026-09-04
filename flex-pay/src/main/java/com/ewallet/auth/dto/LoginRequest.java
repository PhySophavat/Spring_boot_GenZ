package com.ewallet.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @JsonAlias({"username", "userEmail"})
    String email,

    @JsonAlias({"phone", "userPhone"})
    String phoneNumber,

    @NotBlank(message = "Password is required")
    String password
) {
    public String identifier() {
        if (email != null && !email.isBlank()) {
            return email.trim();
        }
        if (phoneNumber != null && !phoneNumber.isBlank()) {
            return phoneNumber.trim();
        }
        return "";
    }
}
