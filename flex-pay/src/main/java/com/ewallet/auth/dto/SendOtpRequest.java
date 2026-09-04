package com.ewallet.auth.dto;

import com.ewallet.auth.entity.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SendOtpRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    String email,

    OtpPurpose purpose
) {
    public String getEmail() {
        return email;
    }
}
