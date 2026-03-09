package org.thomcgn.backend.messenger.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.thomcgn.backend.messenger.model.Message;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query(value = """
        SELECT m.id AS messageId,
               m.subject AS subject,
               m.body AS body,
               m.created_at AS createdAt,
               COUNT(mr.id) AS recipientCount,
               STRING_AGG(
                   COALESCE(NULLIF(TRIM(CONCAT(COALESCE(ru.vorname,''),' ',COALESCE(ru.nachname,''))), ''), ru.email),
                   ', ' ORDER BY ru.email
               ) AS recipientNames
        FROM messages m
        LEFT JOIN message_recipients mr ON mr.message_id = m.id AND mr.deleted_at IS NULL
        LEFT JOIN users ru ON ru.id = mr.user_id
        WHERE m.sender_id = :senderId
        GROUP BY m.id, m.subject, m.body, m.created_at
        ORDER BY m.created_at DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<Map<String, Object>> findSent(@Param("senderId") Long senderId, @Param("limit") int limit);

    @Query(value = """
        SELECT m.id AS messageId,
               m.subject AS subject,
               m.body AS body,
               m.created_at AS createdAt,
               m.sender_id AS senderId,
               COALESCE(NULLIF(TRIM(CONCAT(COALESCE(su.vorname,''),' ',COALESCE(su.nachname,''))), ''), su.email) AS senderName,
               mr.id AS recipientRowId,
               mr.is_read AS isRead
        FROM messages m
        JOIN users su ON su.id = m.sender_id
        LEFT JOIN message_recipients mr ON mr.message_id = m.id AND mr.user_id = :userId
        WHERE m.id = :messageId
    """, nativeQuery = true)
    Optional<Map<String, Object>> findDetailForUser(@Param("messageId") Long messageId, @Param("userId") Long userId);
}
