package com.ewallet.chat.controller;

import com.ewallet.chat.dto.*;
import com.ewallet.chat.service.ChatService;
import com.ewallet.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * REST controller for all admin chat operations.
 *
 * All endpoints under /api/admin/chat/** require ROLE_ADMIN (enforced by SecurityConfig).
 * The requesting admin is extracted from the Spring Security context — never from request params.
 */
@RestController
@RequestMapping("/api/admin/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    // ─────────────────────────────────────────────────────────────────
    // Conversations
    // ─────────────────────────────────────────────────────────────────

    /** GET /api/admin/chat/conversations — list all conversations for the admin */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations(
        @AuthenticationPrincipal User admin
    ) {
        List<ConversationResponse> conversations = chatService.getConversationsForUser(admin.getId());
        return ResponseEntity.ok(ApiResponse.ok(conversations));
    }

    /** GET /api/admin/chat/conversations/{id} — single conversation */
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversation(
        @PathVariable Long conversationId,
        @AuthenticationPrincipal User admin
    ) {
        ConversationResponse conv = chatService.getConversation(conversationId, admin.getId());
        return ResponseEntity.ok(ApiResponse.ok(conv));
    }

    /** POST /api/admin/chat/conversations — create or return existing direct conversation */
    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<ConversationResponse>> createConversation(
        @Valid @RequestBody CreateConversationRequest request,
        @AuthenticationPrincipal User admin
    ) {
        ConversationResponse conv =
            chatService.createOrGetDirectConversation(admin.getId(), request.getTargetUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(conv));
    }

    // ─────────────────────────────────────────────────────────────────
    // Messages
    // ─────────────────────────────────────────────────────────────────

    /** GET /api/admin/chat/conversations/{id}/messages?page=0&size=30 */
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getMessages(
        @PathVariable Long conversationId,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "30") int size,
        @AuthenticationPrincipal User admin
    ) {
        Page<MessageResponse> messages = chatService.getMessages(conversationId, admin.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.ok(messages));
    }

    /** POST /api/admin/chat/conversations/{id}/messages — send a message via REST */
    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
        @PathVariable Long conversationId,
        @Valid @RequestBody SendMessageRequest request,
        @AuthenticationPrincipal User admin
    ) {
        request.setConversationId(conversationId);
        MessageResponse msg = chatService.sendMessage(request, admin.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(msg));
    }

    /** PUT /api/admin/chat/messages/{messageId} — edit a message */
    @PutMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
        @PathVariable Long messageId,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal User admin
    ) {
        String newContent = body.get("content");
        if (newContent == null || newContent.isBlank()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("content is required"));
        }
        MessageResponse msg = chatService.editMessage(messageId, newContent, admin.getId());
        return ResponseEntity.ok(ApiResponse.ok(msg));
    }

    /** DELETE /api/admin/chat/messages/{messageId} — soft-delete a message */
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<MessageResponse>> deleteMessage(
        @PathVariable Long messageId,
        @AuthenticationPrincipal User admin
    ) {
        // Admins can delete any message
        MessageResponse msg = chatService.deleteMessage(messageId, admin.getId(), true);
        return ResponseEntity.ok(ApiResponse.ok(msg));
    }

    /** POST /api/admin/chat/messages/{messageId}/read — mark message as read */
    @PostMapping("/messages/{messageId}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
        @PathVariable Long messageId,
        @AuthenticationPrincipal User admin
    ) {
        chatService.markMessageRead(messageId, admin.getId());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ─────────────────────────────────────────────────────────────────
    // User search
    // ─────────────────────────────────────────────────────────────────

    /** GET /api/admin/chat/users/search?keyword= */
    @GetMapping("/users/search")
    public ResponseEntity<ApiResponse<List<ConversationResponse.MemberInfo>>> searchUsers(
        @RequestParam String keyword
    ) {
        List<ConversationResponse.MemberInfo> users = chatService.searchUsers(keyword);
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    // ─────────────────────────────────────────────────────────────────
    // File upload / serving
    // ─────────────────────────────────────────────────────────────────

    /** POST /api/admin/chat/upload — upload a file; returns file URL */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadFile(
        @RequestParam("file") MultipartFile file
    ) {
        try {
            Map<String, Object> result = chatService.uploadFile(file);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("File upload error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("File upload failed"));
        }
    }

    /**
     * GET /api/admin/chat/files/{filename} — serve a stored file.
     * Security: only permits ADMIN access (inherited from SecurityConfig pattern).
     * In production, serve files via nginx and never through the application.
     */
    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            // Prevent path traversal: strip directory components
            String safeName = Paths.get(filename).getFileName().toString();
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(safeName);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeName + "\"")
                .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Global exception handling within this controller
    // ─────────────────────────────────────────────────────────────────

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(SecurityException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ApiResponse.error(e.getMessage()));
    }
}
