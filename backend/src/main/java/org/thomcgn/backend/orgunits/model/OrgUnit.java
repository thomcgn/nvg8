package org.thomcgn.backend.orgunits.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.tenants.model.Traeger;

@Entity
@Table(
        name = "org_units",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_orgunit_traeger_parent_name",
                columnNames = {"traeger_id", "parent_id", "name"}
        ),
        indexes = {
                @Index(name = "ix_orgunit_traeger_type", columnList = "traeger_id,type"),
                @Index(name = "ix_orgunit_parent", columnList = "parent_id")
        }
)
public class OrgUnit extends AuditableEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "traeger_id", nullable = false)
    private Traeger traeger;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrgUnitType type;

    @Column(nullable = false, length = 120)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private OrgUnit parent;

    @Column(nullable = false)
    private boolean enabled = true;

    public Long getId() { return id; }
    public Traeger getTraeger() { return traeger; }
    public OrgUnitType getType() { return type; }
    public String getName() { return name; }
    public OrgUnit getParent() { return parent; }
    public boolean isEnabled() { return enabled; }

    public void setTraeger(Traeger traeger) { this.traeger = traeger; }
    public void setType(OrgUnitType type) { this.type = type; }
    public void setName(String name) { this.name = name; }
    public void setParent(OrgUnit parent) { this.parent = parent; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}