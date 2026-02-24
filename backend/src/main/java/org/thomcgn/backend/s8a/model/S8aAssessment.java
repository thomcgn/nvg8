package org.thomcgn.backend.s8a.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.users.model.User;

/**
 * Strukturierte fachliche Einschätzung ("Schutzkonzept" im §8a-Kontext)
 * mit expliziter Versionierung pro Vorgang.
 *
 * Wichtig:
 * - pro S8aCase fortlaufende Version (1..n)
 * - Kernpunkte werden strukturiert gespeichert, nicht als Freitext-Event
 * - Beteiligte zunächst als JSON-Array (List<String>) für Flexibilität
 */
@Entity
@Table(
        name = "s8a_assessments",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_s8a_assessment_case_version", columnNames = {"s8a_case_id", "version"})
        },
        indexes = {
                @Index(name = "ix_s8a_assessment_case", columnList = "s8a_case_id"),
                @Index(name = "ix_s8a_assessment_case_version", columnList = "s8a_case_id,version")
        }
)
public class S8aAssessment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Owner-Case. Versionierung ist pro Case eindeutig.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "s8a_case_id", nullable = false)
    private S8aCase s8aCase;

    /**
     * Versionsnummer (beginnend bei 1) – ist pro s8aCase eindeutig.
     */
    @Column(nullable = false)
    private int version;

    @Enumerated(EnumType.STRING)
    @Column(name = "gefaehrdungsart", nullable = false, length = 50)
    private S8aGefaehrdungsart gefaehrdungsart = S8aGefaehrdungsart.UNKLAR;

    /**
     * Beteiligte als JSON-Array.
     *
     * Warum JSON?
     * - Wir wollen Struktur statt Freitext
     * - aber noch nicht sofort ein starres relationales Modell (Personen/Orgunits/Externe)
     * - in Phase 2 kann daraus ein echtes Value-Object/Join-Modell werden.
     */
    @Lob
    @Column(name = "beteiligte_json")
    private String beteiligteJson;

    @Column(name = "kindesanhoerung", nullable = false)
    private boolean kindesanhoerung;

    @Column(name = "iefk_beteiligt", nullable = false)
    private boolean iefkBeteiligt;

    @Column(name = "jugendamt_informiert", nullable = false)
    private boolean jugendamtInformiert;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    public Long getId() { return id; }

    public S8aCase getS8aCase() { return s8aCase; }
    public void setS8aCase(S8aCase s8aCase) { this.s8aCase = s8aCase; }

    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }

    public S8aGefaehrdungsart getGefaehrdungsart() { return gefaehrdungsart; }
    public void setGefaehrdungsart(S8aGefaehrdungsart gefaehrdungsart) { this.gefaehrdungsart = gefaehrdungsart; }

    public String getBeteiligteJson() { return beteiligteJson; }
    public void setBeteiligteJson(String beteiligteJson) { this.beteiligteJson = beteiligteJson; }

    public boolean isKindesanhoerung() { return kindesanhoerung; }
    public void setKindesanhoerung(boolean kindesanhoerung) { this.kindesanhoerung = kindesanhoerung; }

    public boolean isIefkBeteiligt() { return iefkBeteiligt; }
    public void setIefkBeteiligt(boolean iefkBeteiligt) { this.iefkBeteiligt = iefkBeteiligt; }

    public boolean isJugendamtInformiert() { return jugendamtInformiert; }
    public void setJugendamtInformiert(boolean jugendamtInformiert) { this.jugendamtInformiert = jugendamtInformiert; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
}