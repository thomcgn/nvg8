package org.thomcgn.backend.users.model;

import jakarta.persistence.*;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.orgunits.model.OrgUnit;

@Entity
@Table(
        name = "user_org_roles",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_org_role",
                columnNames = {"user_id", "org_unit_id", "role"}
        ),
        indexes = {
                @Index(name = "ix_uor_user", columnList = "user_id"),
                @Index(name = "ix_uor_org", columnList = "org_unit_id")
        }
)
public class UserOrgRole extends AuditableEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_unit_id", nullable = false)
    private OrgUnit orgUnit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Role role;

    @Column(nullable = false)
    private boolean enabled = true;

    public Long getId() { return id; }
    public User getUser() { return user; }
    public OrgUnit getOrgUnit() { return orgUnit; }
    public Role getRole() { return role; }
    public boolean isEnabled() { return enabled; }

    public void setUser(User user) { this.user = user; }
    public void setOrgUnit(OrgUnit orgUnit) { this.orgUnit = orgUnit; }
    public void setRole(Role role) { this.role = role; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}