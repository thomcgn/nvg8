package org.thomcgn.backend.faelle.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.users.model.User;

@Entity
@Table(
        name = "fall_notizen",
        indexes = {
                @Index(name="ix_notiz_fall_created", columnList="fall_id,created_at")
        }
)
public class FallNotiz extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fall_id", nullable = false)
    private Fall fall;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @Column(nullable = false, length = 4000)
    private String text;

    @Column(length = 40)
    private String typ; // optional: "TELEFONAT", "HAUSBESUCH", ...

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NoteVisibility visibility = NoteVisibility.INTERN;

    public NoteVisibility getVisibility() { return visibility; }
    public void setVisibility(NoteVisibility visibility) { this.visibility = visibility; }

    public Long getId() { return id; }
    public Fall getFall() { return fall; }
    public void setFall(Fall fall) { this.fall = fall; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getTyp() { return typ; }
    public void setTyp(String typ) { this.typ = typ; }
}