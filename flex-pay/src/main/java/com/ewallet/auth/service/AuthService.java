package com.ewallet.auth.service;

import com.ewallet.auth.dto.AuthResponse;
import com.ewallet.auth.dto.LoginRequest;
import com.ewallet.auth.dto.RegisterRequest;
import com.ewallet.common.security.JwtService;
import com.ewallet.users.dto.UserRegistrationRequest;
import com.ewallet.users.dto.UserResponse;
import com.ewallet.users.entity.User;
import com.ewallet.users.repository.UserRepository;
import com.ewallet.users.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class AuthService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
        UserService userService,
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        UserResponse user = userService.createUser(
            new UserRegistrationRequest(
                request.fullName(),
                request.phone(),
                null,
                request.password()
            )
        );
        String accessToken = jwtService.generateToken(user.phone());
        return new AuthResponse(
            "Register successful",
            accessToken,
            "Bearer",
            jwtService.getExpirationMs(),
            user
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByPhone(request.phone().trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid phone or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid phone or password");
        }

        UserResponse response = new UserResponse(
            user.getId(),
            user.getFullName(),
            user.getPhone(),
            user.getEmail(),
            user.getCreatedAt()
        );

        String accessToken = jwtService.generateToken(user.getPhone());
        return new AuthResponse(
            "Login successful",
            accessToken,
            "Bearer",
            jwtService.getExpirationMs(),
            response
        );
    }
}
