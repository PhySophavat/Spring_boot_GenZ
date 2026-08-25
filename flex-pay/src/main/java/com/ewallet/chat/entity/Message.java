package com.ewallet.chat.entity;

import com.ewallet.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a single chat message. Supports TEXT, IMAGE, and FILE types.
 * Soft-delete via isDeleted; edits are tracked via isEdited.
 * Reply threading is supported via replyToMessage self-reference.
 */
@Entity
@Table(name = "messages",
    indexes = {
        @Index(name = "idx_messages_conversation", columnList = "conversation_id,created_at DESC"),
        @Index(name = "idx_messages_sender",       columnList = "sender_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    /** Message body; null when message_type is IMAGE/FILE and content is replaced by attachment */
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    /** TEXT | IMAGE | FILE */
    @Column(name = "message_type", nullable = false, length = 20)
    @Builder.Default
    private String messageType = "TEXT";

    /** Self-reference for threaded replies */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_message_id")
    private Message replyToMessage;

    @Column(name = "is_edited", nullable = false)
    @Builder.Default
    private Boolean isEdited = false;

    /** Soft-delete: content is replaced with null when deleted */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MessageRead> reads = new ArrayList<>();

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Attachment> attachments = new ArrayList<>();
}
