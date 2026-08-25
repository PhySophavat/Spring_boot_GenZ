package com.ewallet.chat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Represents a file or image attached to a message.
 * MIME type is always server-validated (never trusted from client).
 * File URL points to the upload storage path.
 */
@Entity
@Table(name = "attachments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    /** Original filename as sanitized on the server side */
    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    /** Relative or absolute URL used by the frontend to retrieve the file */
    @Column(name = "file_url", nullable = false, length = 1000)
    private String fileUrl;

    /** Server-detected MIME type (e.g. image/jpeg, application/pdf) */
    @Column(name = "file_type", nullable = false, length = 100)
    private String fileType;

    /** File size in bytes */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
