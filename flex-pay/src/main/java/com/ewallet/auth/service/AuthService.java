package com.ewallet.auth.service;

import com.ewallet.auth.dto.*;
import com.ewallet.auth.entity.OtpPurpose;
import com.ewallet.common.security.JwtService;
import com.ewallet.user.dto.UserRegistrationRequest;
import com.ewallet.user.dto.UserResponse;
import com.ewallet.user.dto.UserWithWalletResponse;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import com.ewallet.user.service.UserService;
import com.ewallet.wallet.entity.Wallet;
import com.ewallet.wallet.service.WalletService;
import com.ewallet.payment.service.QrCodeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
@Transactional
@Slf4j
public class AuthService {

    private final UserService userService;
    private final WalletService walletService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final QrCodeService qrCodeService;
    private final EmailService emailService;
    private final OtpService otpService;

    public AuthService(
        UserService userService,
        WalletService walletService,
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        QrCodeService qrCodeService,
        EmailService emailService,
        OtpService otpService
    ) {
        this.userService = userService;
        this.walletService = walletService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.qrCodeService = qrCodeService;
        this.emailService = emailService;
        this.otpService = otpService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (!request.password().equals(request.effectiveConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }

        String email = request.email().trim().toLowerCase();
        String phone = request.effectivePhoneNumber();

        // Check if verified user already exists
        Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCase(email);
        if (existingUserOpt.isPresent()) {
            User existing = existingUserOpt.get();
            if (Boolean.TRUE.equals(existing.getEmailVerified())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
            }
            // User exists but unverified, update password and resend OTP
            existing.setFullName(request.fullName().trim());
            existing.setPasswordHash(passwordEncoder.encode(request.password()));
            userRepository.save(existing);

            String otp = otpService.generateAndSaveOtp(email, OtpPurpose.EMAIL_VERIFICATION);
            try {
                emailService.sendOtpEmail(email, otp);
            } catch (Exception e) {
                log.error("Failed to send OTP to unverified user: {}", e.getMessage());
            }

            return createAuthResponse(existing, "Account pending verification. OTP sent to your email.");
        }

        UserResponse userResponse = userService.createUser(
            new UserRegistrationRequest(
                request.fullName(),
                phone,
                email,
                request.password(),
                request.effectiveConfirmPassword()
            )
        );

        User user = userRepository.findById(userResponse.id())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // If OTP code was supplied directly with registration request
        if (request.otp() != null && !request.otp().isBlank()) {
            otpService.verifyOtp(email, request.otp(), OtpPurpose.EMAIL_VERIFICATION);
            user.setEmailVerified(true);
        } else {
            // Auto-verify email in development mode — no OTP required for registration
            user.setEmailVerified(true);
            user.setAccountStatus("ACTIVE");
        }

        userRepository.save(user);
        Wallet wallet = walletService.createWalletForUser(user.getId());
        qrCodeService.getOrCreateToken(user);

        return createAuthResponse(user, "Registration successful");
    }

    public AuthResponse verifyEmail(String email, String otp) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        String cleanEmail = email.trim().toLowerCase();
        otpService.verifyOtp(cleanEmail, otp, OtpPurpose.EMAIL_VERIFICATION);

        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + cleanEmail));

        user.setEmailVerified(true);
        user.setAccountStatus("ACTIVE");
        userRepository.save(user);

        walletService.createWalletForUser(user.getId());
        return createAuthResponse(user, "Email verified successfully");
    }

    public void resendEmailOtp(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        String cleanEmail = email.trim().toLowerCase();
        String otp = otpService.generateAndSaveOtp(cleanEmail, OtpPurpose.EMAIL_VERIFICATION);
        try {
            emailService.sendOtpEmail(cleanEmail, otp);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to send OTP email: " + e.getMessage());
        }
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.identifier();
        if (identifier.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email or phone number is required");
        }

        User user = userRepository.findByEmailIgnoreCase(identifier)
            .or(() -> userRepository.findByPhoneNumber(identifier))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect.");
        }

        // Email verification check skipped in development mode
        // if (Boolean.FALSE.equals(user.getEmailVerified())) {
        //     throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your email hasn't been verified.");
        // }

        if (!"ACTIVE".equals(user.getAccountStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is not active");
        }

        // Reset pinVerified session flag on login
        user.setPinVerified(false);
        userRepository.save(user);

        return createAuthResponse(user, "Login successful");
    }

    public void forgotPassword(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account found with email: " + cleanEmail + ". Please sign up first."));

        String otp = otpService.generateAndSaveOtp(cleanEmail, OtpPurpose.PASSWORD_RESET);
        try {
            emailService.sendOtpEmail(cleanEmail, otp);
        } catch (Exception e) {
            log.error("Failed to send password reset OTP: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to send reset email: " + e.getMessage());
        }
    }

    public VerifyResetOtpResponse verifyResetOtp(String email, String otp) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        String cleanEmail = email.trim().toLowerCase();
        String resetToken = otpService.verifyOtpAndGenerateResetToken(cleanEmail, otp, OtpPurpose.PASSWORD_RESET);
        return new VerifyResetOtpResponse(true, resetToken, "OTP verified successfully");
    }

    public void resetPassword(ResetPasswordRequest request) {
        if (!request.newPassword().equals(request.effectiveConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }

        String cleanEmail = request.email().trim().toLowerCase();

        if (request.resetToken() != null && !request.resetToken().isBlank()) {
            otpService.validateAndConsumeResetToken(cleanEmail, request.resetToken());
        } else if (request.otp() != null && !request.otp().isBlank()) {
            otpService.verifyOtp(cleanEmail, request.otp(), OtpPurpose.PASSWORD_RESET);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token or OTP is required");
        }

        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + cleanEmail));

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    public void forgotPin(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No user found with email: " + cleanEmail));

        String otp = otpService.generateAndSaveOtp(cleanEmail, OtpPurpose.PIN_RESET);
        try {
            emailService.sendOtpEmail(cleanEmail, otp);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to send OTP email: " + e.getMessage());
        }
    }

    public VerifyResetOtpResponse verifyPinResetOtp(String email, String otp) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        String cleanEmail = email.trim().toLowerCase();
        String resetToken = otpService.verifyOtpAndGenerateResetToken(cleanEmail, otp, OtpPurpose.PIN_RESET);
        return new VerifyResetOtpResponse(true, resetToken, "OTP verified successfully");
    }

    public void resetPin(ResetPinRequest request) {
        String cleanEmail = request.email().trim().toLowerCase();
        otpService.validateAndConsumeResetToken(cleanEmail, request.resetToken());

        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + cleanEmail));

        user.setPinHash(passwordEncoder.encode(request.newPin()));
        user.setPinCreated(true);
        user.setPinFailedAttempts(0);
        user.setPinLockExpiresAt(null);
        userRepository.save(user);
    }

    public void createPin(Authentication authentication, String pin, String confirmPin) {
        User user = getAuthenticatedUser(authentication);
        walletService.createPin(user.getId(), pin, confirmPin);
    }

    public PinVerificationResponse verifyPin(Authentication authentication, String pin) {
        User user = getAuthenticatedUser(authentication);
        boolean valid = walletService.verifyPin(user.getId(), pin);
        return new PinVerificationResponse(valid, valid ? "PIN verified successfully" : "Invalid PIN");
    }

    public void changePin(Authentication authentication, String currentPin, String newPin, String confirmPin) {
        User user = getAuthenticatedUser(authentication);
        walletService.changePin(user.getId(), currentPin, newPin, confirmPin);
    }

    public void sendRegistrationOtp(String email, String phoneNumber) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        String cleanEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }
        if (phoneNumber != null && !phoneNumber.isBlank() && userRepository.existsByPhoneNumber(phoneNumber.trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone number is already registered");
        }

        String otp = otpService.generateAndSaveOtp(cleanEmail, OtpPurpose.EMAIL_VERIFICATION);
        try {
            emailService.sendOtpEmail(cleanEmail, otp);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to send OTP email: " + e.getMessage());
        }
    }

    public User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        User principal = (User) authentication.getPrincipal();
        return userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));
    }

    private AuthResponse createAuthResponse(User user, String message) {
        Wallet wallet = walletService.createWalletForUser(user.getId());
        UserWithWalletResponse userWithWallet = new UserWithWalletResponse(
            user.getId(),
            user.getFullName(),
            user.getPhoneNumber(),
            user.getEmail(),
            user.getCreatedAt(),
            wallet.getId(),
            wallet.getWalletId(),
            wallet.getWalletNumber(),
            Boolean.TRUE.equals(user.getPinCreated())
        );

        String accessToken = jwtService.generateToken(user.getPhoneNumber());
        return new AuthResponse(
            message,
            accessToken,
            "Bearer",
            jwtService.getExpirationMs(),
            userWithWallet
        );
    }
}
