package com.ewallet.chat.repository;

import com.ewallet.chat.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Message entities.
 * Uses pagination to support infinite scroll (30 messages per page).
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Fetches paginated messages for a conversation ordered by createdAt DESC
     * so the most recent messages come first. The frontend reverses the order for display.
     */
    @Query("""
        SELECT m FROM Message m
        WHERE m.conversation.id = :conversationId
        ORDER BY m.createdAt DESC
        """)
    Page<Message> findByConversationIdOrderByCreatedAtDesc(
        @Param("conversationId") Long conversationId,
        Pageable pageable
    );

    /**
     * Count unread messages in a conversation for a specific user.
     * A message is unread if no MessageRead record exists for it and this user.
     */
    @Query("""
        SELECT COUNT(m) FROM Message m
        WHERE m.conversation.id = :conversationId
          AND m.sender.id <> :userId
          AND m.isDeleted = false
          AND NOT EXISTS (
              SELECT r FROM MessageRead r
              WHERE r.message = m AND r.user.id = :userId
          )
        """)
    long countUnreadMessages(
        @Param("conversationId") Long conversationId,
        @Param("userId") Long userId
    );

    /**
     * Full-text search across non-deleted messages in a conversation.
     * Uses ILIKE for case-insensitive matching on PostgreSQL.
     */
    @Query("""
        SELECT m FROM Message m
        WHERE m.conversation.id = :conversationId
          AND m.isDeleted = false
          AND LOWER(m.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
        ORDER BY m.createdAt DESC
        """)
    Page<Message> searchMessages(
        @Param("conversationId") Long conversationId,
        @Param("keyword") String keyword,
        Pageable pageable
    );
}
