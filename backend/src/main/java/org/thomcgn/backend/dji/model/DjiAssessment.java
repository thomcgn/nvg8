package org.thomcgn.backend.dji.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.users.model.User;

import java.time.LocalDate;

@Entity
@Table(
        name = "dji_assessments",
        indexes = {
                @Index(name = "ix_dji_assessment_fall",    columnList = "falloeffnung_id"),
                @Index(name = "ix_dji_assessment_traeger", columnList = "traeger_id,einrichtung_org_unit_id")
        }
)
public class DjiAssessment extends AuditableEntity {

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

    @Enumerated(EnumType.STRING)
    @Column(name = "form_typ", nullable = false, length = 60)
    private DjiFormTyp formTyp;

    @Column(name = "bewertungsdatum", nullable = false)
    private LocalDate bewertungsdatum;

    /** Formtyp-spezifischer Gesamturteil-Code (z. B. "HOHES_RISIKO"). */
    @Column(name = "gesamteinschaetzung", length = 60)
    private String gesamteinschaetzung;

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

    public DjiFormTyp getFormTyp() { return formTyp; }
    public void setFormTyp(DjiFormTyp formTyp) { this.formTyp = formTyp; }

    public LocalDate getBewertungsdatum() { return bewertungsdatum; }
    public void setBewertungsdatum(LocalDate bewertungsdatum) { this.bewertungsdatum = bewertungsdatum; }

    public String getGesamteinschaetzung() { return gesamteinschaetzung; }
    public void setGesamteinschaetzung(String gesamteinschaetzung) { this.gesamteinschaetzung = gesamteinschaetzung; }

    public String getGesamtfreitext() { return gesamtfreitext; }
    public void setGesamtfreitext(String gesamtfreitext) { this.gesamtfreitext = gesamtfreitext; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
}
