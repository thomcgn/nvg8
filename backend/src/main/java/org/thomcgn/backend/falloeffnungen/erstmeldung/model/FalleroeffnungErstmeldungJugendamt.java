package org.thomcgn.backend.falloeffnungen.erstmeldung.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

import java.time.Instant;

@Entity
@Table(name = "falloeffnung_erstmeldung_jugendamt")
public class FalleroeffnungErstmeldungJugendamt extends AuditableEntity {

    @Id
    @Column(name = "erstmeldung_id")
    private Long erstmeldungId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "erstmeldung_id")
    private FalleroeffnungErstmeldung erstmeldung;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private JugendamtInformiert informiert;

    @Column(name = "kontakt_am")
    private Instant kontaktAm;

    @Enumerated(EnumType.STRING)
    private JugendamtKontaktart kontaktart;

    @Column(columnDefinition = "text")
    private String aktenzeichen;

    @Column(columnDefinition = "text")
    private String begruendung;

    public Long getErstmeldungId() { return erstmeldungId; }

    public FalleroeffnungErstmeldung getErstmeldung() { return erstmeldung; }
    public void setErstmeldung(FalleroeffnungErstmeldung erstmeldung) { this.erstmeldung = erstmeldung; }

    public JugendamtInformiert getInformiert() { return informiert; }
    public void setInformiert(JugendamtInformiert informiert) { this.informiert = informiert; }

    public Instant getKontaktAm() { return kontaktAm; }
    public void setKontaktAm(Instant kontaktAm) { this.kontaktAm = kontaktAm; }

    public JugendamtKontaktart getKontaktart() { return kontaktart; }
    public void setKontaktart(JugendamtKontaktart kontaktart) { this.kontaktart = kontaktart; }

    public String getAktenzeichen() { return aktenzeichen; }
    public void setAktenzeichen(String aktenzeichen) { this.aktenzeichen = aktenzeichen; }

    public String getBegruendung() { return begruendung; }
    public void setBegruendung(String begruendung) { this.begruendung = begruendung; }
}