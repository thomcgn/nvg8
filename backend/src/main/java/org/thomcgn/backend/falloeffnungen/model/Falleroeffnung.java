package org.thomcgn.backend.falloeffnungen.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.dossiers.model.KindDossier;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.users.model.User;

import java.time.Instant;

@Entity
@Table(
        name = "falloeffnungen",
        indexes = {
                @Index(name="ix_falloeffnung_traeger_einr", columnList="traeger_id,einrichtung_org_unit_id"),
                @Index(name="ix_falloeffnung_dossier", columnList="dossier_id"),
                @Index(name="ix_falloeffnung_status", columnList="status")
        }
)
public class Falleroeffnung extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dossier_id", nullable = false)
    private KindDossier dossier;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "traeger_id", nullable = false)
    private Traeger traeger;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "einrichtung_org_unit_id", nullable = false)
    private OrgUnit einrichtungOrgUnit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_org_unit_id")
    private OrgUnit teamOrgUnit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FalleroeffnungStatus status = FalleroeffnungStatus.OFFEN;

    @Column(length = 200)
    private String titel;

    @Column(length = 2000)
    private String kurzbeschreibung;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @Column(name = "aktenzeichen", nullable = false, length = 50, unique = true)
    private String aktenzeichen;

    @Column(nullable = false)
    private Instant openedAt = Instant.now();

    private Instant closedAt;

    public Long getId() { return id; }

    @Column(name = "fall_no", nullable = false)
    private Integer fallNo;

    public Integer getFallNo() { return fallNo; }
    public void setFallNo(Integer fallNo) { this.fallNo = fallNo; }

    public KindDossier getDossier() { return dossier; }
    public void setDossier(KindDossier dossier) { this.dossier = dossier; }

    public Traeger getTraeger() { return traeger; }
    public void setTraeger(Traeger traeger) { this.traeger = traeger; }

    public OrgUnit getEinrichtungOrgUnit() { return einrichtungOrgUnit; }
    public void setEinrichtungOrgUnit(OrgUnit einrichtungOrgUnit) { this.einrichtungOrgUnit = einrichtungOrgUnit; }

    public OrgUnit getTeamOrgUnit() { return teamOrgUnit; }
    public void setTeamOrgUnit(OrgUnit teamOrgUnit) { this.teamOrgUnit = teamOrgUnit; }

    public FalleroeffnungStatus getStatus() { return status; }
    public void setStatus(FalleroeffnungStatus status) { this.status = status; }

    public String getTitel() { return titel; }
    public void setTitel(String titel) { this.titel = titel; }

    public String getKurzbeschreibung() { return kurzbeschreibung; }
    public void setKurzbeschreibung(String kurzbeschreibung) { this.kurzbeschreibung = kurzbeschreibung; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public String getAktenzeichen() { return aktenzeichen; }
    public void setAktenzeichen(String aktenzeichen) { this.aktenzeichen = aktenzeichen; }

    public Instant getOpenedAt() { return openedAt; }
    public void setOpenedAt(Instant openedAt) { this.openedAt = openedAt; }

    public Instant getClosedAt() { return closedAt; }
    public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }
}