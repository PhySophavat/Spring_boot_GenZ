package com.ewallet.chat.repository;

import com.ewallet.chat.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for file/image attachments linked to messages.
 */
@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByMessageId(Long messageId);
}
