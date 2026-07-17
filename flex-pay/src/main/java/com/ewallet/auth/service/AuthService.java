package com.ewallet.auth.service;

import com.ewallet.auth.dto.*;
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
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class AuthService {

    private final UserService userService;
    private final WalletService walletService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final QrCodeService qrCodeService;

    public AuthService(
        UserService userService,
        WalletService walletService,
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        QrCodeService qrCodeService
    ) {
        this.userService = userService;
        this.walletService = walletService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.qrCodeService = qrCodeService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }

        UserResponse userResponse = userService.createUser(
            new UserRegistrationRequest(
                request.fullName(),
                request.phoneNumber(),
                request.email(),
                request.password(),
                request.confirmPassword()
            )
        );

        Wallet wallet = walletService.createWalletForUser(userResponse.id());
        
        // Generate secure public token right after registration
        User user = userRepository.findById(userResponse.id())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        qrCodeService.getOrCreateToken(user);
        
        UserWithWalletResponse userWithWallet = new UserWithWalletResponse(
            userResponse.id(),
            userResponse.fullName(),
            userResponse.phoneNumber(),
            userResponse.email(),
            userResponse.createdAt(),
            wallet.getId(),
            wallet.getWalletId(),
            wallet.getWalletNumber(),
            false
        );

        String accessToken = jwtService.generateToken(userResponse.phoneNumber());
        return new AuthResponse(
            "Registration successful",
            accessToken,
            "Bearer",
            jwtService.getExpirationMs(),
            userWithWallet
        );
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByPhoneNumber(request.phoneNumber().trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid phone number or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid phone number or password");
        }

        if (!"ACTIVE".equals(user.getAccountStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is not active");
        }

        // Do NOT allow money transfers until PIN is verified.
        // Therefore, we reset the pinVerified flag to false on login.
        user.setPinVerified(false);
        userRepository.save(user);

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
            "Login successful",
            accessToken,
            "Bearer",
            jwtService.getExpirationMs(),
            userWithWallet
        );
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

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        User principal = (User) authentication.getPrincipal();
        // Reload user from DB to keep hibernate session active and fields fresh
        return userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));
    }
}
