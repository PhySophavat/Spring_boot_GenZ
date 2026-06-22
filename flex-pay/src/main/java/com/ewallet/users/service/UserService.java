package com.ewallet.users.service;

import com.ewallet.users.dto.UserRegistrationRequest;
import com.ewallet.users.dto.UserResponse;
import com.ewallet.users.entity.User;
import com.ewallet.users.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    public UserResponse createUser(UserRegistrationRequest request) {
        String phone = normalizePhone(request.phone());
        String email = normalizeEmail(request.email());

        if (userRepository.existsByPhone(phone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone number already exists");
        }

        if (email != null && userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setPhone(phone);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));

        return toResponse(userRepository.save(user));
    }

    public UserResponse updateUser(Long id, UserRegistrationRequest request) {
        String phone = normalizePhone(request.phone());
        String email = normalizeEmail(request.email());

        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        userRepository.findByPhone(phone)
            .filter(existingUser -> !existingUser.getId().equals(id))
            .ifPresent(existingUser -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone number already exists");
            });

        if (email != null) {
            userRepository.findByEmailIgnoreCase(email)
                .filter(existingUser -> !existingUser.getId().equals(id))
                .ifPresent(existingUser -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
                });
        }

        user.setFullName(request.fullName().trim());
        user.setPhone(phone);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));

        return toResponse(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        userRepository.deleteById(id);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getFullName(),
            user.getPhone(),
            user.getEmail(),
            user.getCreatedAt()
        );
    }

    private String normalizePhone(String phone) {
        return phone.trim();
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }

        String normalized = email.trim().toLowerCase();
        return normalized.isEmpty() ? null : normalized;
    }
}
