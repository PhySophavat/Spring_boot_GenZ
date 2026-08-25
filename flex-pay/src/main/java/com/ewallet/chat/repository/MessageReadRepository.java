package com.ewallet.chat.repository;

import com.ewallet.chat.entity.MessageRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for MessageRead read-receipt records.
 */
@Repository
public interface MessageReadRepository extends JpaRepository<MessageRead, Long> {

    boolean existsByMessageIdAndUserId(Long messageId, Long userId);

    Optional<MessageRead> findByMessageIdAndUserId(Long messageId, Long userId);
}
