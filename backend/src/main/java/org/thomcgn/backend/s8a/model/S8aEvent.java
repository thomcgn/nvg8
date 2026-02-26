package org.thomcgn.backend.s8a.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.users.model.User;

@Entity
@Table(
        name = "s8a_events",
        indexes = {
                @Index(name="ix_s8a_event_case", columnList="s8a_case_id"),
                @Index(name="ix_s8a_event_type", columnList="type")
        }
)
public class S8aEvent extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="s8a_case_id", nullable = false)
    private S8aCase s8aCase;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private S8aEventType type;

    // Optional: strukturierte Daten als JSON (Postgres JSONB später)

    @Column(name="payload_json", columnDefinition = "text")
    private String payloadJson;

    @Column(length = 2000)
    private String text;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="created_by_user_id", nullable = false)
    private User createdBy;

    public Long getId() { return id; }
    public S8aCase getS8aCase() { return s8aCase; }
    public void setS8aCase(S8aCase s8aCase) { this.s8aCase = s8aCase; }
    public S8aEventType getType() { return type; }
    public void setType(S8aEventType type) { this.type = type; }
    public String getPayloadJson() { return payloadJson; }
    public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
}