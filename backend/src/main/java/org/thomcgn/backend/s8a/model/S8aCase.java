package org.thomcgn.backend.s8a.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.users.model.User;

@Entity
@Table(
        name = "s8a_cases",
        indexes = {
                @Index(name="ix_s8a_falloeffnung", columnList="falloeffnung_id"),
                @Index(name="ix_s8a_status", columnList="status")
        }
)
public class S8aCase extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="falloeffnung_id", nullable = false)
    private Falleroeffnung falleroeffnung;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="traeger_id", nullable = false)
    private Traeger traeger;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="einrichtung_org_unit_id", nullable = false)
    private OrgUnit einrichtung;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private S8aStatus status = S8aStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private S8aRiskLevel riskLevel = S8aRiskLevel.UNGEKLAERT;

    @Column(length = 200)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="created_by_user_id", nullable = false)
    private User createdBy;

    public Long getId() { return id; }

    public Falleroeffnung getFalleroeffnung() { return falleroeffnung; }
    public void setFalleroeffnung(Falleroeffnung falleroeffnung) { this.falleroeffnung = falleroeffnung; }

    public Traeger getTraeger() { return traeger; }
    public void setTraeger(Traeger traeger) { this.traeger = traeger; }

    public OrgUnit getEinrichtung() { return einrichtung; }
    public void setEinrichtung(OrgUnit einrichtung) { this.einrichtung = einrichtung; }

    public S8aStatus getStatus() { return status; }
    public void setStatus(S8aStatus status) { this.status = status; }

    public S8aRiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(S8aRiskLevel riskLevel) { this.riskLevel = riskLevel; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
}