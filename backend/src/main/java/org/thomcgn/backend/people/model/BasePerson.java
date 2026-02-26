package org.thomcgn.backend.people.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

import java.time.LocalDate;

@MappedSuperclass
public abstract class BasePerson extends AuditableEntity {

    // =====================================================
    // OWNER / TENANT (Option A)
    // =====================================================

    @Column(name = "traeger_id", nullable = false, updatable = false)
    private Long traegerId;

    @Column(name = "owner_einrichtung_org_unit_id", nullable = false, updatable = false)
    private Long ownerEinrichtungOrgUnitId;

    public Long getTraegerId() { return traegerId; }
    public void setTraegerId(Long traegerId) { this.traegerId = traegerId; }

    public Long getOwnerEinrichtungOrgUnitId() { return ownerEinrichtungOrgUnitId; }
    public void setOwnerEinrichtungOrgUnitId(Long ownerEinrichtungOrgUnitId) { this.ownerEinrichtungOrgUnitId = ownerEinrichtungOrgUnitId; }

    // =====================================================
    // PERSONENFELDER
    // =====================================================

    @Column(length = 100)
    private String vorname;

    @Column(length = 100)
    private String nachname;

    private LocalDate geburtsdatum;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Gender gender = Gender.UNBEKANNT;

    @Column(length = 50)
    private String telefon;

    @Column(name = "kontakt_email", length = 254)
    private String kontaktEmail;

    @Column(length = 200)
    private String strasse;

    @Column(length = 30)
    private String hausnummer;

    @Column(length = 10)
    private String plz;

    @Column(length = 120)
    private String ort;

    public String getVorname() { return vorname; }
    public void setVorname(String vorname) { this.vorname = vorname; }

    public String getNachname() { return nachname; }
    public void setNachname(String nachname) { this.nachname = nachname; }

    public LocalDate getGeburtsdatum() { return geburtsdatum; }
    public void setGeburtsdatum(LocalDate geburtsdatum) { this.geburtsdatum = geburtsdatum; }

    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }

    public String getTelefon() { return telefon; }
    public void setTelefon(String telefon) { this.telefon = telefon; }

    public String getKontaktEmail() { return kontaktEmail; }
    public void setKontaktEmail(String kontaktEmail) { this.kontaktEmail = kontaktEmail; }

    public String getStrasse() { return strasse; }
    public void setStrasse(String strasse) { this.strasse = strasse; }

    public String getHausnummer() { return hausnummer; }
    public void setHausnummer(String hausnummer) { this.hausnummer = hausnummer; }

    public String getPlz() { return plz; }
    public void setPlz(String plz) { this.plz = plz; }

    public String getOrt() { return ort; }
    public void setOrt(String ort) { this.ort = ort; }

    public String getDisplayName() {
        String first = vorname != null ? vorname.trim() : "";
        String last = nachname != null ? nachname.trim() : "";
        String full = (first + " " + last).trim();
        return full.isEmpty() ? "-" : full;
    }
}