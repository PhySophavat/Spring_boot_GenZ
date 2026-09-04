package com.ewallet.auth.controller;

import com.ewallet.auth.entity.OtpPurpose;
import com.ewallet.auth.entity.OtpVerification;
import com.ewallet.auth.repository.OtpVerificationRepository;
import com.ewallet.auth.service.EmailService;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class AuthOtpControllerIT {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpVerificationRepository otpVerificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private EmailService emailService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() throws Exception {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        doNothing().when(emailService).sendOtpEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("Forgot Password flow: send OTP -> verify OTP -> reset password -> login with new password")
    void forgotPasswordAndResetPasswordFlow() throws Exception {
        String testEmail = "otp-user@flexpay.com";
        String testPhone = "+85599887766";
        String oldPassword = "OldPassword123!";
        String newPassword = "NewPassword123!";

        // Ensure user exists
        User user = new User();
        user.setFullName("OTP Test User");
        user.setPhoneNumber(testPhone);
        user.setEmail(testEmail);
        user.setPasswordHash(passwordEncoder.encode(oldPassword));
        user.setAccountStatus("ACTIVE");
        user.setRole("USER");
        userRepository.save(user);

        // 1. Request OTP via POST /api/auth/forgot-password?email=...
        mockMvc.perform(post("/api/auth/forgot-password")
                .param("email", testEmail))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("OTP sent"))
            .andExpect(jsonPath("$.email").value(testEmail));

        // Retrieve generated OTP from DB
        OtpVerification otpVerification = otpVerificationRepository
            .findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(testEmail, OtpPurpose.FORGOT_PASSWORD)
            .orElseThrow();
        String generatedOtp = otpVerification.getOtpCode();
        assertThat(generatedOtp).matches("^\\d{6}$");

        // 2. Verify OTP via POST /api/auth/verify-otp
        mockMvc.perform(post("/api/auth/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                      "email": "%s",
                      "otp": "%s",
                      "purpose": "FORGOT_PASSWORD"
                    }
                    """, testEmail, generatedOtp)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.valid").value(true));

        // Re-generate OTP for reset-password call (or reset directly)
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                      "email": "%s"
                    }
                    """, testEmail)))
            .andExpect(status().isOk());

        String resetOtp = otpVerificationRepository
            .findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(testEmail, OtpPurpose.FORGOT_PASSWORD)
            .orElseThrow().getOtpCode();

        // 3. Reset password via POST /api/auth/reset-password
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                      "email": "%s",
                      "otp": "%s",
                      "newPassword": "%s",
                      "confirmPassword": "%s"
                    }
                    """, testEmail, resetOtp, newPassword, newPassword)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Password reset successfully"));

        // 4. Login with new password
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                      "phoneNumber": "%s",
                      "password": "%s"
                    }
                    """, testPhone, newPassword)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").exists())
            .andExpect(jsonPath("$.message").value("Login successful"));
    }
}
