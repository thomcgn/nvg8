package org.thomcgn.backend.falloeffnungen.erstmeldung.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

import java.time.Instant;

@Entity
@Table(
        name = "falloeffnung_erstmeldung_contacts",
        indexes = @Index(name = "ix_erstmeldung_contacts_erstmeldung", columnList = "erstmeldung_id")
)
public class FalleroeffnungErstmeldungContact extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "erstmeldung_id", nullable = false)
    private FalleroeffnungErstmeldung erstmeldung;

    @Enumerated(EnumType.STRING)
    @Column(name = "kontakt_mit", nullable = false, length = 40)
    private KontaktMit kontaktMit;

    @Column(name = "kontakt_am")
    private Instant kontaktAm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private KontaktStatus status;

    @Column(columnDefinition = "text")
    private String notiz;

    @Column(columnDefinition = "text")
    private String ergebnis;

    public Long getId() { return id; }

    public FalleroeffnungErstmeldung getErstmeldung() { return erstmeldung; }
    public void setErstmeldung(FalleroeffnungErstmeldung erstmeldung) { this.erstmeldung = erstmeldung; }

    public KontaktMit getKontaktMit() { return kontaktMit; }
    public void setKontaktMit(KontaktMit kontaktMit) { this.kontaktMit = kontaktMit; }

    public Instant getKontaktAm() { return kontaktAm; }
    public void setKontaktAm(Instant kontaktAm) { this.kontaktAm = kontaktAm; }

    public KontaktStatus getStatus() { return status; }
    public void setStatus(KontaktStatus status) { this.status = status; }

    public String getNotiz() { return notiz; }
    public void setNotiz(String notiz) { this.notiz = notiz; }

    public String getErgebnis() { return ergebnis; }
    public void setErgebnis(String ergebnis) { this.ergebnis = ergebnis; }
}