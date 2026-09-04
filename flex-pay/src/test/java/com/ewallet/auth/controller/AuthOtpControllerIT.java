package com.ewallet.auth.controller;

import com.ewallet.auth.dto.VerifyResetOtpResponse;
import com.ewallet.auth.entity.OtpPurpose;
import com.ewallet.auth.entity.OtpVerification;
import com.ewallet.auth.repository.OtpVerificationRepository;
import com.ewallet.auth.service.EmailService;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
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
import org.springframework.test.web.servlet.MvcResult;
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
    @DisplayName("Complete Registration Flow: Register -> Verify Email -> Login with Email")
    void completeRegistrationAndVerificationFlow() throws Exception {
        String testEmail = "newuser" + System.currentTimeMillis() + "@flexpay.com";
        String password = "StrongPassword123!";

        // 1. POST /api/auth/register
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                      "fullName": "New User",
                      "email": "%s",
                      "password": "%s",
                      "confirmPassword": "%s"
                    }
                    """, testEmail, password, password)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true));

        // 2. Fetch OTP from DB
        OtpVerification otpVerification = otpVerificationRepository
            .findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(testEmail, OtpPurpose.EMAIL_VERIFICATION)
            .orElseThrow();
        String otp = otpVerification.getOtpCode();
        assertThat(otp).matches("^\\d{6}$");

        // 3. POST /api/auth/verify-email
        mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                      "email": "%s",
                      "otp": "%s"
                    }
                    """, testEmail, otp)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.token").isNotEmpty());

        // 4. POST /api/auth/login using email
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                      "email": "%s",
                      "password": "%s"
                    }
                    """, testEmail, password)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("Password Recovery Flow: Forgot Password -> Verify Reset OTP -> Reset Password -> Login")
    void forgotPasswordAndResetPasswordFlow() throws Exception {
        String testEmail = "reset-user" + System.currentTimeMillis() + "@flexpay.com";
        String oldPassword = "OldPassword123!";
        String newPassword = "NewPassword123!";

        User user = new User();
        user.setFullName("Reset User");
        user.setPhoneNumber("0" + (100000000 + (long) (Math.random() * 800000000)));
        user.setEmail(testEmail);
        user.setPasswordHash(passwordEncoder.encode(oldPassword));
        user.setEmailVerified(true);
        user.setAccountStatus("ACTIVE");
        user.setRole("USER");
        userRepository.save(user);

        // 1. POST /api/auth/forgot-password
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                      "email": "%s"
                    }
                    """, testEmail)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        // 2. Fetch OTP
        OtpVerification otpVerification = otpVerificationRepository
            .findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(testEmail, OtpPurpose.PASSWORD_RESET)
            .orElseThrow();
        String otp = otpVerification.getOtpCode();

        // 3. POST /api/auth/verify-reset-otp -> returns resetToken
        MvcResult mvcResult = mockMvc.perform(post("/api/auth/verify-reset-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                      "email": "%s",
                      "otp": "%s"
                    }
                    """, testEmail, otp)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.resetToken").isNotEmpty())
            .andReturn();

        JsonNode responseNode = objectMapper.readTree(mvcResult.getResponse().getContentAsString());
        String resetToken = responseNode.get("resetToken").asText();

        // 4. POST /api/auth/reset-password
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                      "email": "%s",
                      "resetToken": "%s",
                      "newPassword": "%s",
                      "confirmPassword": "%s"
                    }
                    """, testEmail, resetToken, newPassword, newPassword)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        // 5. Login with new password
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                      "email": "%s",
                      "password": "%s"
                    }
                    """, testEmail, newPassword)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("PIN Recovery Flow: Forgot PIN -> Verify PIN Reset OTP -> Reset PIN")
    void forgotPinAndResetPinFlow() throws Exception {
        String testEmail = "pin-user" + System.currentTimeMillis() + "@flexpay.com";

        User user = new User();
        user.setFullName("PIN User");
        user.setPhoneNumber("0" + (100000000 + (long) (Math.random() * 800000000)));
        user.setEmail(testEmail);
        user.setPasswordHash(passwordEncoder.encode("Pass12345!"));
        user.setPinHash(passwordEncoder.encode("111111"));
        user.setPinCreated(true);
        user.setEmailVerified(true);
        user.setAccountStatus("ACTIVE");
        user.setRole("USER");
        userRepository.save(user);

        // 1. POST /api/auth/forgot-pin
        mockMvc.perform(post("/api/auth/forgot-pin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                      "email": "%s"
                    }
                    """, testEmail)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        // 2. Fetch OTP
        OtpVerification otpVerification = otpVerificationRepository
            .findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(testEmail, OtpPurpose.PIN_RESET)
            .orElseThrow();
        String otp = otpVerification.getOtpCode();

        // 3. POST /api/auth/verify-pin-reset-otp -> returns resetToken
        MvcResult mvcResult = mockMvc.perform(post("/api/auth/verify-pin-reset-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                      "email": "%s",
                      "otp": "%s"
                    }
                    """, testEmail, otp)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.resetToken").isNotEmpty())
            .andReturn();

        JsonNode responseNode = objectMapper.readTree(mvcResult.getResponse().getContentAsString());
        String resetToken = responseNode.get("resetToken").asText();

        // 4. POST /api/auth/reset-pin
        mockMvc.perform(post("/api/auth/reset-pin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                    {
                      "email": "%s",
                      "resetToken": "%s",
                      "newPin": "654321"
                    }
                    """, testEmail, resetToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        // Verify PIN hash changed in DB
        User updated = userRepository.findByEmailIgnoreCase(testEmail).orElseThrow();
        assertThat(passwordEncoder.matches("654321", updated.getPinHash())).isTrue();
    }
}
