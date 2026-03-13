package org.thomcgn.backend.meldebogen.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.users.model.User;

import java.time.LocalDate;

@Entity
@Table(
        name = "meldeboegen",
        indexes = {
                @Index(name = "ix_meldebogen_fall",    columnList = "falloeffnung_id"),
                @Index(name = "ix_meldebogen_traeger", columnList = "traeger_id,einrichtung_org_unit_id")
        }
)
public class Meldebogen extends AuditableEntity {

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

    @Column(name = "eingangsdatum", nullable = false)
    private LocalDate eingangsdatum;

    @Column(name = "erfassende_fachkraft", length = 200)
    private String erfassendeFachkraft;

    @Column(name = "meldungart", length = 30)
    private String meldungart;

    @Column(name = "melder_name", length = 200)
    private String melderName;

    @Column(name = "melder_kontakt")
    private String melderKontakt;

    @Column(name = "melder_beziehung_kind", length = 200)
    private String melderBeziehungKind;

    @Column(name = "melder_glaubwuerdigkeit", length = 20)
    private String melderGlaubwuerdigkeit;

    @Column(name = "schilderung")
    private String schilderung;

    @Column(name = "kind_aktueller_aufenthalt")
    private String kindAktuellerAufenthalt;

    @Column(name = "belastung_koerperl_erkrankung", nullable = false)
    private boolean belastungKoerperlErkrankung;

    @Column(name = "belastung_psych_erkrankung", nullable = false)
    private boolean belastungPsychErkrankung;

    @Column(name = "belastung_sucht", nullable = false)
    private boolean belastungSucht;

    @Column(name = "belastung_haeusliche_gewalt", nullable = false)
    private boolean belastungHaeuslicheGewalt;

    @Column(name = "belastung_suizidgefahr", nullable = false)
    private boolean belastungSuizidgefahr;

    @Column(name = "belastung_gewalttaetige_erz", nullable = false)
    private boolean belastungGewalttaetigeErz;

    @Column(name = "belastung_soziale_isolation", nullable = false)
    private boolean belastungSozialeIsolation;

    @Column(name = "belastung_sonstiges")
    private String belastungSonstiges;

    @Column(name = "ersteinschaetzung", length = 30)
    private String ersteinschaetzung;

    @Column(name = "handlungsdringlichkeit", length = 30)
    private String handlungsdringlichkeit;

    @Column(name = "ersteinschaetzung_freitext")
    private String ersteinschaetzungFreitext;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    public Long getId() { return id; }

    public Falleroeffnung getFalloeffnung() { return falloeffnung; }
    public void setFalloeffnung(Falleroeffnung falloeffnung) { this.falloeffnung = falloeffnung; }

    public Traeger getTraeger() { return traeger; }
    public void setTraeger(Traeger traeger) { this.traeger = traeger; }

    public OrgUnit getEinrichtungOrgUnit() { return einrichtungOrgUnit; }
    public void setEinrichtungOrgUnit(OrgUnit einrichtungOrgUnit) { this.einrichtungOrgUnit = einrichtungOrgUnit; }

    public LocalDate getEingangsdatum() { return eingangsdatum; }
    public void setEingangsdatum(LocalDate eingangsdatum) { this.eingangsdatum = eingangsdatum; }

    public String getErfassendeFachkraft() { return erfassendeFachkraft; }
    public void setErfassendeFachkraft(String erfassendeFachkraft) { this.erfassendeFachkraft = erfassendeFachkraft; }

    public String getMeldungart() { return meldungart; }
    public void setMeldungart(String meldungart) { this.meldungart = meldungart; }

    public String getMelderName() { return melderName; }
    public void setMelderName(String melderName) { this.melderName = melderName; }

    public String getMelderKontakt() { return melderKontakt; }
    public void setMelderKontakt(String melderKontakt) { this.melderKontakt = melderKontakt; }

    public String getMelderBeziehungKind() { return melderBeziehungKind; }
    public void setMelderBeziehungKind(String melderBeziehungKind) { this.melderBeziehungKind = melderBeziehungKind; }

    public String getMelderGlaubwuerdigkeit() { return melderGlaubwuerdigkeit; }
    public void setMelderGlaubwuerdigkeit(String melderGlaubwuerdigkeit) { this.melderGlaubwuerdigkeit = melderGlaubwuerdigkeit; }

    public String getSchilderung() { return schilderung; }
    public void setSchilderung(String schilderung) { this.schilderung = schilderung; }

    public String getKindAktuellerAufenthalt() { return kindAktuellerAufenthalt; }
    public void setKindAktuellerAufenthalt(String kindAktuellerAufenthalt) { this.kindAktuellerAufenthalt = kindAktuellerAufenthalt; }

    public boolean isBelastungKoerperlErkrankung() { return belastungKoerperlErkrankung; }
    public void setBelastungKoerperlErkrankung(boolean v) { this.belastungKoerperlErkrankung = v; }

    public boolean isBelastungPsychErkrankung() { return belastungPsychErkrankung; }
    public void setBelastungPsychErkrankung(boolean v) { this.belastungPsychErkrankung = v; }

    public boolean isBelastungSucht() { return belastungSucht; }
    public void setBelastungSucht(boolean v) { this.belastungSucht = v; }

    public boolean isBelastungHaeuslicheGewalt() { return belastungHaeuslicheGewalt; }
    public void setBelastungHaeuslicheGewalt(boolean v) { this.belastungHaeuslicheGewalt = v; }

    public boolean isBelastungSuizidgefahr() { return belastungSuizidgefahr; }
    public void setBelastungSuizidgefahr(boolean v) { this.belastungSuizidgefahr = v; }

    public boolean isBelastungGewalttaetigeErz() { return belastungGewalttaetigeErz; }
    public void setBelastungGewalttaetigeErz(boolean v) { this.belastungGewalttaetigeErz = v; }

    public boolean isBelastungSozialeIsolation() { return belastungSozialeIsolation; }
    public void setBelastungSozialeIsolation(boolean v) { this.belastungSozialeIsolation = v; }

    public String getBelastungSonstiges() { return belastungSonstiges; }
    public void setBelastungSonstiges(String belastungSonstiges) { this.belastungSonstiges = belastungSonstiges; }

    public String getErsteinschaetzung() { return ersteinschaetzung; }
    public void setErsteinschaetzung(String ersteinschaetzung) { this.ersteinschaetzung = ersteinschaetzung; }

    public String getHandlungsdringlichkeit() { return handlungsdringlichkeit; }
    public void setHandlungsdringlichkeit(String handlungsdringlichkeit) { this.handlungsdringlichkeit = handlungsdringlichkeit; }

    public String getErsteinschaetzungFreitext() { return ersteinschaetzungFreitext; }
    public void setErsteinschaetzungFreitext(String ersteinschaetzungFreitext) { this.ersteinschaetzungFreitext = ersteinschaetzungFreitext; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
}
