package org.thomcgn.backend.people.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.faelle.model.Fall;

@Entity
@Table(
        name = "fall_beteiligte",
        uniqueConstraints = {
                @UniqueConstraint(name="uk_fall_kind", columnNames = {"fall_id", "kind_id"}),
                @UniqueConstraint(name="uk_fall_bezugsperson", columnNames = {"fall_id", "bezugsperson_id"})
        },
        indexes = @Index(name="ix_fall_beteiligte_fall", columnList="fall_id")
)
public class FallBeteiligter extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="fall_id", nullable = false)
    private Fall fall;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="kind_id")
    private Kind kind;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bezugsperson_id")
    private Bezugsperson bezugsperson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private FallRolle rolle;

    @Column(nullable = false)
    private boolean primaryFlag = false;

    @PrePersist
    @PreUpdate
    void validateOneSide() {
        boolean hasKind = kind != null;
        boolean hasBez = bezugsperson != null;
        if (hasKind == hasBez) {
            throw new IllegalStateException("FallBeteiligter must reference exactly one of (kind, bezugsperson).");
        }
    }

    public Long getId() { return id; }

    public Fall getFall() { return fall; }
    public void setFall(Fall fall) { this.fall = fall; }

    public Kind getKind() { return kind; }
    public void setKind(Kind kind) { this.kind = kind; }

    public Bezugsperson getBezugsperson() { return bezugsperson; }
    public void setBezugsperson(Bezugsperson bezugsperson) { this.bezugsperson = bezugsperson; }

    public FallRolle getRolle() { return rolle; }
    public void setRolle(FallRolle rolle) { this.rolle = rolle; }

    public boolean isPrimaryFlag() { return primaryFlag; }
    public void setPrimaryFlag(boolean primaryFlag) { this.primaryFlag = primaryFlag; }
}