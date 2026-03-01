package org.thomcgn.backend.falloeffnungen.meldung.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

import java.time.Instant;

@Entity
@Table(name="meldung_contacts", indexes = {
        @Index(name="ix_meldung_contacts_meldung", columnList="meldung_id")
})
public class MeldungContact extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="meldung_id", nullable = false)
    private Meldung meldung;

    @Enumerated(EnumType.STRING)
    @Column(name="kontakt_mit", nullable = false, length = 40)
    private KontaktMit kontaktMit;

    @Column(name="kontakt_am")
    private Instant kontaktAm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private KontaktStatus status;

    @Column(columnDefinition = "text")
    private String notiz;

    @Column(columnDefinition = "text")
    private String ergebnis;

    public Long getId() { return id; }

    public Meldung getMeldung() { return meldung; }
    public void setMeldung(Meldung meldung) { this.meldung = meldung; }

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