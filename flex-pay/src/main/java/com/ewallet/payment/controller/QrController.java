package com.ewallet.payment.controller;

import com.ewallet.payment.dto.QrVerifyRequest;
import com.ewallet.payment.dto.QrVerifyResponse;
import com.ewallet.payment.service.QrCodeService;
import com.ewallet.user.entity.User;
import com.ewallet.user.entity.UserPublicToken;
import com.ewallet.user.repository.UserRepository;
import com.ewallet.user.repository.UserPublicTokenRepository;
import com.ewallet.wallet.entity.Wallet;
import com.ewallet.wallet.repository.WalletRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@Tag(name = "QR", description = "QR generation and verification APIs")
public class QrController {

    private final QrCodeService qrCodeService;
    private final UserPublicTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;

    public QrController(
        QrCodeService qrCodeService,
        UserPublicTokenRepository tokenRepository,
        UserRepository userRepository,
        WalletRepository walletRepository
    ) {
        this.qrCodeService = qrCodeService;
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
    }

    @GetMapping("/api/users/me/token")
    @Operation(summary = "Get current user secure public QR token")
    public ResponseEntity<java.util.Map<String, String>> getMyToken(Authentication authentication) {
        User loggedInUser = getAuthenticatedUser(authentication);
        UserPublicToken token = qrCodeService.getOrCreateToken(loggedInUser);
        return ResponseEntity.ok(java.util.Map.of("token", token.getPublicToken()));
    }

    @GetMapping(value = "/api/users/me/qr", produces = MediaType.IMAGE_PNG_VALUE)
    @Operation(summary = "Get current user static QR Code as PNG image")
    public ResponseEntity<byte[]> getMyQrCode(Authentication authentication) {
        User loggedInUser = getAuthenticatedUser(authentication);
        UserPublicToken token = qrCodeService.getOrCreateToken(loggedInUser);
        byte[] qrBytes = qrCodeService.generateQrPng(token.getPublicToken());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
        return new ResponseEntity<>(qrBytes, headers, HttpStatus.OK);
    }

    @PostMapping("/api/qr/verify")
    @Operation(summary = "Verify user public token from scanned QR code")
    public ResponseEntity<QrVerifyResponse> verifyQr(@Valid @RequestBody QrVerifyRequest request) {
        UserPublicToken token = tokenRepository.findByPublicTokenAndActiveTrue(request.getToken())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid or inactive receiver token"));

        User receiver = token.getUser();
        if (receiver == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver not found");
        }

        // Verify wallet exists
        walletRepository.findByUserId(receiver.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver wallet not found"));

        QrVerifyResponse response = new QrVerifyResponse(
            receiver.getFullName(),
            "https://api.dicebear.com/7.x/adventurer/svg?seed=" + receiver.getFullName(),
            List.of("USD", "KHR")
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/api/qr/decode", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload and decode a QR code image")
    public ResponseEntity<java.util.Map<String, Object>> decodeQrCode(
        @RequestParam("file") org.springframework.web.multipart.MultipartFile file
    ) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No image file provided");
        }
        try {
            String rawQrText = qrCodeService.decodeQrImage(file.getInputStream());
            
            // Try extracting token if JSON: {"token":"USR_..."}
            String token = rawQrText;
            if (rawQrText.contains("\"token\"")) {
                int start = rawQrText.indexOf("\"token\":") + 8;
                int valStart = rawQrText.indexOf("\"", start);
                if (valStart != -1) {
                    int valEnd = rawQrText.indexOf("\"", valStart + 1);
                    if (valEnd != -1) {
                        token = rawQrText.substring(valStart + 1, valEnd);
                    }
                }
            }

            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("rawText", rawQrText);
            result.put("token", token);
            result.put("success", true);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to decode QR: " + e.getMessage());
        }
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        User principal = (User) authentication.getPrincipal();
        return userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
