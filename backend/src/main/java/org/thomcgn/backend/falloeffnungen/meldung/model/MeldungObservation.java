package org.thomcgn.backend.falloeffnungen.meldung.model;

import jakarta.persistence.*;
import org.thomcgn.backend.users.model.User;

import java.time.Instant;

@Entity
@Table(
        name="meldung_observations",
        indexes = {
                @Index(name="ix_meldung_obs_meldung", columnList="meldung_id"),
                @Index(name="ix_meldung_obs_zeitpunkt", columnList="zeitpunkt")
        }
)
public class MeldungObservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="meldung_id", nullable = false)
    private Meldung meldung;

    private Instant zeitpunkt;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ObservationZeitraum zeitraum;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ObservationOrt ort;

    @Column(name="ort_sonstiges", length = 200)
    private String ortSonstiges;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ObservationQuelle quelle;

    @Column(nullable = false, length = 4000)
    private String text = "";

    @Column(name="woertliches_zitat", length = 4000)
    private String woertlichesZitat;

    @Column(name="koerperbefund", length = 4000)
    private String koerperbefund;

    @Column(name="verhalten_kind", length = 4000)
    private String verhaltenKind;

    @Column(name="verhalten_bezug", length = 4000)
    private String verhaltenBezug;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Sichtbarkeit sichtbarkeit = Sichtbarkeit.INTERN;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="created_by_user_id", nullable = false)
    private User createdBy;

    @Column(nullable = false, length = 200)
    private String createdByDisplayName;

    public Long getId() { return id; }

    public Meldung getMeldung() { return meldung; }
    public void setMeldung(Meldung meldung) { this.meldung = meldung; }

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
    public void setText(String text) { this.text = text == null ? "" : text; }

    public String getWoertlichesZitat() { return woertlichesZitat; }
    public void setWoertlichesZitat(String woertlichesZitat) { this.woertlichesZitat = woertlichesZitat; }

    public String getKoerperbefund() { return koerperbefund; }
    public void setKoerperbefund(String koerperbefund) { this.koerperbefund = koerperbefund; }

    public String getVerhaltenKind() { return verhaltenKind; }
    public void setVerhaltenKind(String verhaltenKind) { this.verhaltenKind = verhaltenKind; }

    public String getVerhaltenBezug() { return verhaltenBezug; }
    public void setVerhaltenBezug(String verhaltenBezug) { this.verhaltenBezug = verhaltenBezug; }

    public Sichtbarkeit getSichtbarkeit() { return sichtbarkeit; }
    public void setSichtbarkeit(Sichtbarkeit sichtbarkeit) { this.sichtbarkeit = sichtbarkeit == null ? Sichtbarkeit.INTERN : sichtbarkeit; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public String getCreatedByDisplayName() { return createdByDisplayName; }
    public void setCreatedByDisplayName(String createdByDisplayName) { this.createdByDisplayName = createdByDisplayName; }
}