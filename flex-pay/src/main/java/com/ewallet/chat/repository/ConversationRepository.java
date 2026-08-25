package com.ewallet.chat.repository;

import com.ewallet.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Conversation entities.
 * Queries fetch conversations the requesting user is a member of,
 * ordered by most recently updated.
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * Returns all conversations that the given user is a member of,
     * ordered by updatedAt descending (most recent first).
     */
    @Query("""
        SELECT c FROM Conversation c
        JOIN c.members m
        WHERE m.user.id = :userId
        ORDER BY c.updatedAt DESC
        """)
    List<Conversation> findAllByMemberUserId(@Param("userId") Long userId);

    /**
     * Finds an existing DIRECT conversation between exactly two users.
     * Prevents duplicate conversations for the same pair.
     */
    @Query("""
        SELECT c FROM Conversation c
        WHERE c.type = 'DIRECT'
          AND (SELECT COUNT(m) FROM ConversationMember m WHERE m.conversation = c) = 2
          AND EXISTS (SELECT m FROM ConversationMember m WHERE m.conversation = c AND m.user.id = :userId1)
          AND EXISTS (SELECT m FROM ConversationMember m WHERE m.conversation = c AND m.user.id = :userId2)
        """)
    Optional<Conversation> findDirectConversationBetween(
        @Param("userId1") Long userId1,
        @Param("userId2") Long userId2
    );
}
