package org.thomcgn.backend.faelle.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.users.model.User;

@Entity
@Table(
        name = "faelle",
        indexes = {
                @Index(name="ix_fall_traeger_einr", columnList="traeger_id,einrichtung_org_unit_id"),
                @Index(name="ix_fall_status", columnList="status")
        }
)
public class Fall extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "traeger_id", nullable = false)
    private Traeger traeger;

    // “Owner scope” für Berechtigungen: Einrichtung ist die stabile Klammer
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "einrichtung_org_unit_id", nullable = false)
    private OrgUnit einrichtungOrgUnit;

    // optional: wenn Fall konkret einem Team zugeordnet
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_org_unit_id")
    private OrgUnit teamOrgUnit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FallStatus status = FallStatus.OFFEN;

    @Column(length = 200)
    private String titel;

    @Column(length = 2000)
    private String kurzbeschreibung;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    // --- getters/setters ---
    public Long getId() { return id; }

    public Traeger getTraeger() { return traeger; }
    public void setTraeger(Traeger traeger) { this.traeger = traeger; }

    public OrgUnit getEinrichtungOrgUnit() { return einrichtungOrgUnit; }
    public void setEinrichtungOrgUnit(OrgUnit einrichtungOrgUnit) { this.einrichtungOrgUnit = einrichtungOrgUnit; }

    public OrgUnit getTeamOrgUnit() { return teamOrgUnit; }
    public void setTeamOrgUnit(OrgUnit teamOrgUnit) { this.teamOrgUnit = teamOrgUnit; }

    public FallStatus getStatus() { return status; }
    public void setStatus(FallStatus status) { this.status = status; }

    public String getTitel() { return titel; }
    public void setTitel(String titel) { this.titel = titel; }

    public String getKurzbeschreibung() { return kurzbeschreibung; }
    public void setKurzbeschreibung(String kurzbeschreibung) { this.kurzbeschreibung = kurzbeschreibung; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
}