package org.thomcgn.backend.messenger.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "message_recipients",
        uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "user_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageRecipient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "message_id", nullable = false)
    private Long messageId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Make default robust: entity ensures it's never null
    @Column(nullable = false)
    private String folder;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead;

    @Column(name = "read_at")
    private OffsetDateTime readAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    // Option A: Hibernate sets it on insert
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (folder == null) folder = "INBOX";
        if (isRead == null) isRead = false;
        // createdAt handled by @CreationTimestamp; if you remove it, set here:
        // if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        // Keep readAt consistent if you want:
        if (Boolean.TRUE.equals(isRead) && readAt == null) {
            readAt = OffsetDateTime.now();
        }
        // If someone marks unread, you might want to clear readAt:
        if (Boolean.FALSE.equals(isRead)) {
            readAt = null;
        }
    }
}