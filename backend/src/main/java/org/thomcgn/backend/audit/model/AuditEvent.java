package org.thomcgn.backend.audit.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.users.model.User;

@Entity
@Table(
        name = "audit_events",
        indexes = {
                @Index(name="ix_audit_traeger_created", columnList="traeger_id,created_at"),
                @Index(name="ix_audit_entity", columnList="entity_type,entity_id")
        }
)
public class AuditEvent extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "traeger_id", nullable = false)
    private Traeger traeger;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_unit_id")
    private OrgUnit orgUnit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private AuditEventAction action;

    @Column(name="entity_type", nullable = false, length = 80)
    private String entityType; // "Fall", "FallNotiz", ...

    @Column(name="entity_id", nullable = false)
    private Long entityId;

    @Column(length = 2000)
    private String message;

    public Long getId() { return id; }

    public Traeger getTraeger() { return traeger; }
    public void setTraeger(Traeger traeger) { this.traeger = traeger; }

    public OrgUnit getOrgUnit() { return orgUnit; }
    public void setOrgUnit(OrgUnit orgUnit) { this.orgUnit = orgUnit; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public AuditEventAction getAction() { return action; }
    public void setAction(AuditEventAction action) { this.action = action; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}