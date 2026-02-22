package org.thomcgn.backend.falloeffnungen.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.users.model.User;

@Entity
@Table(
        name = "falloeffnung_notizen",
        indexes = {
                @Index(name="ix_falloeffnung_notiz_fall", columnList="falloeffnung_id")
        }
)
public class FalleroeffnungNotiz extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="falloeffnung_id", nullable = false)
    private Falleroeffnung falleroeffnung;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="created_by_user_id", nullable = false)
    private User createdBy;

    @Column(length = 100)
    private String typ;

    @Column(nullable = false, length = 8000)
    private String text;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NoteVisibility visibility = NoteVisibility.INTERN;

    public Long getId() { return id; }
    public Falleroeffnung getFalleroeffnung() { return falleroeffnung; }
    public void setFalleroeffnung(Falleroeffnung falleroeffnung) { this.falleroeffnung = falleroeffnung; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public String getTyp() { return typ; }
    public void setTyp(String typ) { this.typ = typ; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public NoteVisibility getVisibility() { return visibility; }
    public void setVisibility(NoteVisibility visibility) { this.visibility = visibility; }
}