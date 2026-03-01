package org.thomcgn.backend.falloeffnungen.meldung.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

import java.time.Instant;

@Entity
@Table(name="meldung_jugendamt")
public class MeldungJugendamt extends AuditableEntity {

    @Id
    @Column(name="meldung_id")
    private Long meldungId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name="meldung_id", nullable = false)
    private Meldung meldung;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private JugendamtInformiert informiert;

    private Instant kontaktAm;

    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    private JugendamtKontaktart kontaktart;

    @Column(columnDefinition = "text")
    private String aktenzeichen;

    @Column(columnDefinition = "text")
    private String begruendung;

    public Long getMeldungId() { return meldungId; }

    public Meldung getMeldung() { return meldung; }
    public void setMeldung(Meldung meldung) { this.meldung = meldung; }

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