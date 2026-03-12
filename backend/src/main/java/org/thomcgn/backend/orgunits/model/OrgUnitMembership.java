package org.thomcgn.backend.orgunits.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.users.model.User;

/**
 * Unified membership table – Phase 1 (dual-write).
 *
 * Ersetzt langfristig:
 *   - user_org_roles   (role gesetzt, membership_type null)
 *   - user_team_memberships (membership_type gesetzt, role null oder abgeleitet)
 */
@Entity
@Table(name = "org_unit_memberships")
public class OrgUnitMembership extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_unit_id", nullable = false)
    private OrgUnit orgUnit;

    /** Berechtigungsrolle – aus user_org_roles (FACHKRAFT, TEAMLEITUNG, TRAEGER_ADMIN …) */
    @Column(length = 40)
    private String role;

    /** Team-spezifische Qualifikation – aus user_team_memberships (MITGLIED, PRAKTIKANT …) */
    @Column(name = "membership_type", length = 50)
    private String membershipType;

    @Column(name = "is_primary", nullable = false)
    private boolean primary = false;

    @Column(nullable = false)
    private boolean enabled = true;

    public Long getId()                  { return id; }
    public User getUser()                { return user; }
    public OrgUnit getOrgUnit()          { return orgUnit; }
    public String getRole()              { return role; }
    public String getMembershipType()    { return membershipType; }
    public boolean isPrimary()           { return primary; }
    public boolean isEnabled()           { return enabled; }

    public void setUser(User user)                      { this.user = user; }
    public void setOrgUnit(OrgUnit orgUnit)             { this.orgUnit = orgUnit; }
    public void setRole(String role)                    { this.role = role; }
    public void setMembershipType(String membershipType){ this.membershipType = membershipType; }
    public void setPrimary(boolean primary)             { this.primary = primary; }
    public void setEnabled(boolean enabled)             { this.enabled = enabled; }
}
