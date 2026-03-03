package org.thomcgn.backend.falloeffnungen.meldung.model;

import jakarta.persistence.*;
import org.thomcgn.backend.users.model.User;

import java.time.Instant;

@Entity
@Table(
        name = "meldung_changes",
        indexes = {
                @Index(name="ix_meldung_change_meldung", columnList="meldung_id"),
                @Index(name="ix_meldung_change_section", columnList="section")
        }
)
public class MeldungChange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="meldung_id", nullable = false)
    private Meldung meldung;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MeldungSection section;

    @Column(name="field_path", nullable = false, length = 300)
    private String fieldPath;

    @Column(name="old_value", length = 4000)
    private String oldValue;

    @Column(name="new_value", length = 4000)
    private String newValue;

    @Column(name="reason", nullable = false, length = 2000)
    private String reason;

    @Column(name="changed_at", nullable = false)
    private Instant changedAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="changed_by_user_id", nullable = false)
    private User changedBy;

    @Column(name="changed_by_display_name", nullable = false, length = 200)
    private String changedByDisplayName;

    public Long getId() { return id; }

    public Meldung getMeldung() { return meldung; }
    public void setMeldung(Meldung meldung) { this.meldung = meldung; }

    public MeldungSection getSection() { return section; }
    public void setSection(MeldungSection section) { this.section = section; }

    public String getFieldPath() { return fieldPath; }
    public void setFieldPath(String fieldPath) { this.fieldPath = fieldPath; }

    public String getOldValue() { return oldValue; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }

    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Instant getChangedAt() { return changedAt; }
    public void setChangedAt(Instant changedAt) { this.changedAt = changedAt; }

    public User getChangedBy() { return changedBy; }
    public void setChangedBy(User changedBy) { this.changedBy = changedBy; }

    public String getChangedByDisplayName() { return changedByDisplayName; }
    public void setChangedByDisplayName(String changedByDisplayName) { this.changedByDisplayName = changedByDisplayName; }
}