package org.thomcgn.backend.messenger.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.thomcgn.backend.messenger.model.MessageRecipient;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface MessageRecipientRepository extends JpaRepository<MessageRecipient, Long> {

    @Query("""
        SELECT COUNT(mr)
        FROM MessageRecipient mr
        WHERE mr.userId = :userId
          AND mr.folder = 'INBOX'
          AND mr.isRead = false
          AND mr.deletedAt IS NULL
    """)
    long countUnread(Long userId);

    @Query(value = """
        SELECT mr.id AS recipientRowId,
               mr.is_read AS isRead,
               m.id AS messageId,
               m.subject AS subject,
               m.body AS body,
               m.created_at AS createdAt,
               m.sender_id AS senderId,
               COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.vorname,''),' ',COALESCE(u.nachname,''))), ''), u.email) AS senderName
        FROM message_recipients mr
        JOIN messages m ON m.id = mr.message_id
        JOIN users u ON u.id = m.sender_id
        WHERE mr.user_id = :userId
          AND mr.folder = 'INBOX'
          AND mr.deleted_at IS NULL
        ORDER BY m.created_at DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<Map<String, Object>> findInbox(Long userId, int limit);

    @Query(value = """
        SELECT COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.vorname,''),' ',COALESCE(u.nachname,''))), ''), u.email)
        FROM message_recipients mr
        JOIN users u ON u.id = mr.user_id
        WHERE mr.message_id = :messageId
          AND mr.deleted_at IS NULL
    """, nativeQuery = true)
    List<String> findRecipientNames(@Param("messageId") Long messageId);

    @Modifying
    @Query("""
        UPDATE MessageRecipient mr
        SET mr.deletedAt = :now
        WHERE mr.id = :id AND mr.userId = :userId
    """)
    void softDelete(@Param("id") Long id, @Param("userId") Long userId, @Param("now") OffsetDateTime now);
}
