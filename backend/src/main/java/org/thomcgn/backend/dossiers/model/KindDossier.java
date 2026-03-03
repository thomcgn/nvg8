package org.thomcgn.backend.dossiers.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.people.model.Kind;
import org.thomcgn.backend.tenants.model.Traeger;

@Entity
@Table(
        name = "kind_dossiers",
        // ✅ Eine Akte ist EINRICHTUNGS-spezifisch (nicht nur Träger-spezifisch).
        // Damit kann z.B. eine Kita nicht ohne Weiteres Schulakten sehen, selbst wenn beide unter demselben Träger hängen.
        uniqueConstraints = @UniqueConstraint(
                name = "uk_dossier_einrichtung_kind",
                columnNames = {"einrichtung_org_unit_id", "kind_id"}
        ),
        indexes = {
                @Index(name = "ix_dossier_einrichtung", columnList = "einrichtung_org_unit_id"),
                @Index(name = "ix_dossier_kind", columnList = "kind_id")
        }
)
public class KindDossier extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ✅ Einrichtung (OrgUnit) der Akte.
     * Der aktive Kontext (SecurityUtils.currentOrgUnitIdRequired()) muss damit übereinstimmen.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "einrichtung_org_unit_id", nullable = false)
    private OrgUnit einrichtungOrgUnit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "traeger_id", nullable = false)
    private Traeger traeger;

    public void setTraeger(Traeger traeger) { this.traeger = traeger; }
    public Traeger getTraeger() { return traeger; }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "kind_id", nullable = false)
    private Kind kind;

    @Column(nullable = false)
    private boolean enabled = true;

    public Long getId() { return id; }

    public OrgUnit getEinrichtungOrgUnit() { return einrichtungOrgUnit; }
    public void setEinrichtungOrgUnit(OrgUnit einrichtungOrgUnit) { this.einrichtungOrgUnit = einrichtungOrgUnit; }

    public Kind getKind() { return kind; }
    public void setKind(Kind kind) { this.kind = kind; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}