package org.thomcgn.backend.falloeffnungen.erstmeldung.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.falloeffnungen.model.FalleroeffnungNotiz;

import java.time.Instant;

@Entity
@Table(
        name = "falloeffnung_erstmeldung_observations",
        indexes = @Index(name = "ix_erstmeldung_obs_erstmeldung", columnList = "erstmeldung_id")
)
public class FalleroeffnungErstmeldungObservation extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "erstmeldung_id", nullable = false)
    private FalleroeffnungErstmeldung erstmeldung;

    private Instant zeitpunkt;

    @Enumerated(EnumType.STRING)
    private ObservationZeitraum zeitraum;

    @Enumerated(EnumType.STRING)
    private ObservationOrt ort;

    @Column(name = "ort_sonstiges", columnDefinition = "text")
    private String ortSonstiges;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ObservationQuelle quelle;

    @Column(nullable = false, columnDefinition = "text")
    private String text;

    @Column(name = "woertliches_zitat", columnDefinition = "text")
    private String woertlichesZitat;

    @Column(name = "koerperbefund", columnDefinition = "text")
    private String koerperbefund;

    @Column(name = "verhalten_kind", columnDefinition = "text")
    private String verhaltenKind;

    @Column(name = "verhalten_bezug", columnDefinition = "text")
    private String verhaltenBezug;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Sichtbarkeit sichtbarkeit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_notiz_id")
    private FalleroeffnungNotiz linkedNotiz;

    public Long getId() { return id; }

    public FalleroeffnungErstmeldung getErstmeldung() { return erstmeldung; }
    public void setErstmeldung(FalleroeffnungErstmeldung erstmeldung) { this.erstmeldung = erstmeldung; }

    public Instant getZeitpunkt() { return zeitpunkt; }
    public void setZeitpunkt(Instant zeitpunkt) { this.zeitpunkt = zeitpunkt; }

    public ObservationZeitraum getZeitraum() { return zeitraum; }
    public void setZeitraum(ObservationZeitraum zeitraum) { this.zeitraum = zeitraum; }

    public ObservationOrt getOrt() { return ort; }
    public void setOrt(ObservationOrt ort) { this.ort = ort; }

    public String getOrtSonstiges() { return ortSonstiges; }
    public void setOrtSonstiges(String ortSonstiges) { this.ortSonstiges = ortSonstiges; }

    public ObservationQuelle getQuelle() { return quelle; }
    public void setQuelle(ObservationQuelle quelle) { this.quelle = quelle; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getWoertlichesZitat() { return woertlichesZitat; }
    public void setWoertlichesZitat(String woertlichesZitat) { this.woertlichesZitat = woertlichesZitat; }

    public String getKoerperbefund() { return koerperbefund; }
    public void setKoerperbefund(String koerperbefund) { this.koerperbefund = koerperbefund; }

    public String getVerhaltenKind() { return verhaltenKind; }
    public void setVerhaltenKind(String verhaltenKind) { this.verhaltenKind = verhaltenKind; }

    public String getVerhaltenBezug() { return verhaltenBezug; }
    public void setVerhaltenBezug(String verhaltenBezug) { this.verhaltenBezug = verhaltenBezug; }

    public Sichtbarkeit getSichtbarkeit() { return sichtbarkeit; }
    public void setSichtbarkeit(Sichtbarkeit sichtbarkeit) { this.sichtbarkeit = sichtbarkeit; }

    public FalleroeffnungNotiz getLinkedNotiz() { return linkedNotiz; }
    public void setLinkedNotiz(FalleroeffnungNotiz linkedNotiz) { this.linkedNotiz = linkedNotiz; }
}