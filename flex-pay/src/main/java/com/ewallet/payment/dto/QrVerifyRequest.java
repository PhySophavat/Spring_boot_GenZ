package com.ewallet.payment.dto;

import jakarta.validation.constraints.NotBlank;

public class QrVerifyRequest {

    @NotBlank(message = "Token is required")
    private String token;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
