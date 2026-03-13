package org.thomcgn.backend.schutzplan.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.users.model.User;

import java.time.LocalDate;

@Entity
@Table(
        name = "schutzplaene",
        indexes = {
                @Index(name = "ix_schutzplan_fall",    columnList = "falloeffnung_id"),
                @Index(name = "ix_schutzplan_traeger", columnList = "traeger_id,einrichtung_org_unit_id")
        }
)
public class Schutzplan extends AuditableEntity {

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

    @Column(name = "erstellt_am", nullable = false)
    private LocalDate erstelltAm;

    @Column(name = "gueltig_bis")
    private LocalDate gueltigBis;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "AKTIV";

    @Column(name = "gefaehrdungssituation")
    private String gefaehrdungssituation;

    @Column(name = "vereinbarungen")
    private String vereinbarungen;

    @Column(name = "beteiligte")
    private String beteiligte;

    @Column(name = "naechster_termin")
    private LocalDate naechsterTermin;

    @Column(name = "gesamtfreitext")
    private String gesamtfreitext;

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

    public LocalDate getErstelltAm() { return erstelltAm; }
    public void setErstelltAm(LocalDate erstelltAm) { this.erstelltAm = erstelltAm; }

    public LocalDate getGueltigBis() { return gueltigBis; }
    public void setGueltigBis(LocalDate gueltigBis) { this.gueltigBis = gueltigBis; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getGefaehrdungssituation() { return gefaehrdungssituation; }
    public void setGefaehrdungssituation(String gefaehrdungssituation) { this.gefaehrdungssituation = gefaehrdungssituation; }

    public String getVereinbarungen() { return vereinbarungen; }
    public void setVereinbarungen(String vereinbarungen) { this.vereinbarungen = vereinbarungen; }

    public String getBeteiligte() { return beteiligte; }
    public void setBeteiligte(String beteiligte) { this.beteiligte = beteiligte; }

    public LocalDate getNaechsterTermin() { return naechsterTermin; }
    public void setNaechsterTermin(LocalDate naechsterTermin) { this.naechsterTermin = naechsterTermin; }

    public String getGesamtfreitext() { return gesamtfreitext; }
    public void setGesamtfreitext(String gesamtfreitext) { this.gesamtfreitext = gesamtfreitext; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
}
