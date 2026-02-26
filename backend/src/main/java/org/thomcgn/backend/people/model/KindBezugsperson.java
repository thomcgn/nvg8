package org.thomcgn.backend.people.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

import java.time.LocalDate;

@Entity
@Table(
        name = "kind_bezugspersonen",
        indexes = {
                @Index(name = "ix_kbp_kind", columnList = "kind_id"),
                @Index(name = "ix_kbp_bezug", columnList = "bezugsperson_id"),
                @Index(name = "ix_kbp_active", columnList = "kind_id,valid_to")
        }
)
public class KindBezugsperson extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "kind_id", nullable = false)
    private Kind kind;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bezugsperson_id", nullable = false)
    private Bezugsperson bezugsperson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private BezugspersonBeziehung beziehung;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private SorgerechtTyp sorgerecht = SorgerechtTyp.UNGEKLAERT;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom = LocalDate.now();

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(nullable = false)
    private boolean hauptkontakt = false;

    @Column(name = "lebt_im_haushalt", nullable = false)
    private boolean lebtImHaushalt = false;

    @Column(nullable = false)
    private boolean enabled = true;

    public Long getId() { return id; }

    public Kind getKind() { return kind; }
    public void setKind(Kind kind) { this.kind = kind; }

    public Bezugsperson getBezugsperson() { return bezugsperson; }
    public void setBezugsperson(Bezugsperson bezugsperson) { this.bezugsperson = bezugsperson; }

    public BezugspersonBeziehung getBeziehung() { return beziehung; }
    public void setBeziehung(BezugspersonBeziehung beziehung) { this.beziehung = beziehung; }

    public SorgerechtTyp getSorgerecht() { return sorgerecht; }
    public void setSorgerecht(SorgerechtTyp sorgerecht) { this.sorgerecht = sorgerecht; }

    public LocalDate getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDate validFrom) { this.validFrom = validFrom; }

    public LocalDate getValidTo() { return validTo; }
    public void setValidTo(LocalDate validTo) { this.validTo = validTo; }

    public boolean isHauptkontakt() { return hauptkontakt; }
    public void setHauptkontakt(boolean hauptkontakt) { this.hauptkontakt = hauptkontakt; }

    public boolean isLebtImHaushalt() { return lebtImHaushalt; }
    public void setLebtImHaushalt(boolean lebtImHaushalt) { this.lebtImHaushalt = lebtImHaushalt; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}