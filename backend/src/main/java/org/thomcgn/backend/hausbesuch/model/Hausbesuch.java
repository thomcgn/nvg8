package org.thomcgn.backend.hausbesuch.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.users.model.User;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
        name = "hausbesuche",
        indexes = {
                @Index(name = "ix_hausbesuch_fall",    columnList = "falloeffnung_id"),
                @Index(name = "ix_hausbesuch_traeger", columnList = "traeger_id,einrichtung_org_unit_id")
        }
)
public class Hausbesuch extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "falloeffnung_id", nullable = false)
    private Falleroeffnung falloeffnung;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "traeger_id", nullable = false)
    private Traeger traeger;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "einrichtung_org_unit_id", nullable = false)
    private OrgUnit einrichtungOrgUnit;

    @Column(name = "besuchsdatum", nullable = false)
    private LocalDate besuchsdatum;

    @Column(name = "besuchszeit_von")
    private LocalTime besuchszeitVon;

    @Column(name = "besuchszeit_bis")
    private LocalTime besuchszeitBis;

    @Column(name = "anwesende")
    private String anwesende;

    // Wohnsituation
    @Column(name = "whg_ordnung", length = 20)
    private String whgOrdnung;

    @Column(name = "whg_hygiene", length = 20)
    private String whgHygiene;

    @Column(name = "whg_nahrungsversorgung", length = 20)
    private String whgNahrungsversorgung;

    @Column(name = "whg_unfallgefahren")
    private String whgUnfallgefahren;

    @Column(name = "whg_sonstiges")
    private String whgSonstiges;

    // Kind-Beobachtungen
    @Column(name = "kind_erscheinungsbild")
    private String kindErscheinungsbild;

    @Column(name = "kind_verhalten")
    private String kindVerhalten;

    @Column(name = "kind_stimmung", length = 30)
    private String kindStimmung;

    @Column(name = "kind_aeusserungen")
    private String kindAeusserungen;

    @Column(name = "kind_hinweise_gefaehrdung")
    private String kindHinweiseGefaehrdung;

    // Bezugspersonen
    @Column(name = "bp_erscheinungsbild")
    private String bpErscheinungsbild;

    @Column(name = "bp_verhalten")
    private String bpVerhalten;

    @Column(name = "bp_umgang_kind")
    private String bpUmgangKind;

    @Column(name = "bp_kooperation", length = 20)
    private String bpKooperation;

    // Gesamteinschätzung
    @Column(name = "einschaetzung_ampel", length = 10)
    private String einschaetzungAmpel;

    @Column(name = "einschaetzung_text")
    private String einschaetzungText;

    @Column(name = "naechste_schritte")
    private String naechsteSchritte;

    @Column(name = "naechster_termin")
    private LocalDate naechsterTermin;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    public Long getId() { return id; }

    public Falleroeffnung getFalloeffnung() { return falloeffnung; }
    public void setFalloeffnung(Falleroeffnung v) { this.falloeffnung = v; }

    public Traeger getTraeger() { return traeger; }
    public void setTraeger(Traeger v) { this.traeger = v; }

    public OrgUnit getEinrichtungOrgUnit() { return einrichtungOrgUnit; }
    public void setEinrichtungOrgUnit(OrgUnit v) { this.einrichtungOrgUnit = v; }

    public LocalDate getBesuchsdatum() { return besuchsdatum; }
    public void setBesuchsdatum(LocalDate v) { this.besuchsdatum = v; }

    public LocalTime getBesuchszeitVon() { return besuchszeitVon; }
    public void setBesuchszeitVon(LocalTime v) { this.besuchszeitVon = v; }

    public LocalTime getBesuchszeitBis() { return besuchszeitBis; }
    public void setBesuchszeitBis(LocalTime v) { this.besuchszeitBis = v; }

    public String getAnwesende() { return anwesende; }
    public void setAnwesende(String v) { this.anwesende = v; }

    public String getWhgOrdnung() { return whgOrdnung; }
    public void setWhgOrdnung(String v) { this.whgOrdnung = v; }

    public String getWhgHygiene() { return whgHygiene; }
    public void setWhgHygiene(String v) { this.whgHygiene = v; }

    public String getWhgNahrungsversorgung() { return whgNahrungsversorgung; }
    public void setWhgNahrungsversorgung(String v) { this.whgNahrungsversorgung = v; }

    public String getWhgUnfallgefahren() { return whgUnfallgefahren; }
    public void setWhgUnfallgefahren(String v) { this.whgUnfallgefahren = v; }

    public String getWhgSonstiges() { return whgSonstiges; }
    public void setWhgSonstiges(String v) { this.whgSonstiges = v; }

    public String getKindErscheinungsbild() { return kindErscheinungsbild; }
    public void setKindErscheinungsbild(String v) { this.kindErscheinungsbild = v; }

    public String getKindVerhalten() { return kindVerhalten; }
    public void setKindVerhalten(String v) { this.kindVerhalten = v; }

    public String getKindStimmung() { return kindStimmung; }
    public void setKindStimmung(String v) { this.kindStimmung = v; }

    public String getKindAeusserungen() { return kindAeusserungen; }
    public void setKindAeusserungen(String v) { this.kindAeusserungen = v; }

    public String getKindHinweiseGefaehrdung() { return kindHinweiseGefaehrdung; }
    public void setKindHinweiseGefaehrdung(String v) { this.kindHinweiseGefaehrdung = v; }

    public String getBpErscheinungsbild() { return bpErscheinungsbild; }
    public void setBpErscheinungsbild(String v) { this.bpErscheinungsbild = v; }

    public String getBpVerhalten() { return bpVerhalten; }
    public void setBpVerhalten(String v) { this.bpVerhalten = v; }

    public String getBpUmgangKind() { return bpUmgangKind; }
    public void setBpUmgangKind(String v) { this.bpUmgangKind = v; }

    public String getBpKooperation() { return bpKooperation; }
    public void setBpKooperation(String v) { this.bpKooperation = v; }

    public String getEinschaetzungAmpel() { return einschaetzungAmpel; }
    public void setEinschaetzungAmpel(String v) { this.einschaetzungAmpel = v; }

    public String getEinschaetzungText() { return einschaetzungText; }
    public void setEinschaetzungText(String v) { this.einschaetzungText = v; }

    public String getNaechsteSchritte() { return naechsteSchritte; }
    public void setNaechsteSchritte(String v) { this.naechsteSchritte = v; }

    public LocalDate getNaechsterTermin() { return naechsterTermin; }
    public void setNaechsterTermin(LocalDate v) { this.naechsterTermin = v; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User v) { this.createdBy = v; }
}
