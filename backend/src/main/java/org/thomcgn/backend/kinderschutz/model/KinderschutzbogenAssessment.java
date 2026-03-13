package org.thomcgn.backend.kinderschutz.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.users.model.User;

import java.time.LocalDate;

@Entity
@Table(
        name = "kinderschutzbogen_assessments",
        indexes = {
                @Index(name = "ix_skb_assessment_fall",    columnList = "falloeffnung_id"),
                @Index(name = "ix_skb_assessment_traeger", columnList = "traeger_id,einrichtung_org_unit_id")
        }
)
public class KinderschutzbogenAssessment extends AuditableEntity {

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
    @Column(nullable = false, length = 20)
    private Altersgruppe altersgruppe;

    @Column(name = "bewertungsdatum", nullable = false)
    private LocalDate bewertungsdatum;

    @Column(name = "gesamteinschaetzung_manuell")
    private Short gesamteinschaetzungManuell;

    @Column(name = "gesamteinschaetzung_freitext")
    private String gesamteinschaetzungFreitext;

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

    public Altersgruppe getAltersgruppe() { return altersgruppe; }
    public void setAltersgruppe(Altersgruppe altersgruppe) { this.altersgruppe = altersgruppe; }

    public LocalDate getBewertungsdatum() { return bewertungsdatum; }
    public void setBewertungsdatum(LocalDate bewertungsdatum) { this.bewertungsdatum = bewertungsdatum; }

    public Short getGesamteinschaetzungManuell() { return gesamteinschaetzungManuell; }
    public void setGesamteinschaetzungManuell(Short gesamteinschaetzungManuell) { this.gesamteinschaetzungManuell = gesamteinschaetzungManuell; }

    public String getGesamteinschaetzungFreitext() { return gesamteinschaetzungFreitext; }
    public void setGesamteinschaetzungFreitext(String gesamteinschaetzungFreitext) { this.gesamteinschaetzungFreitext = gesamteinschaetzungFreitext; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
}
