package org.thomcgn.backend.teams.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.users.model.User;

@Entity
@Table(
        name = "user_team_memberships",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_user_team_memberships_user_team",
                        columnNames = {"user_id", "team_org_unit_id"}
                )
        },
        indexes = {
                @Index(name = "idx_user_team_memberships_team", columnList = "team_org_unit_id"),
                @Index(name = "idx_user_team_memberships_user", columnList = "user_id")
        }
)
public class UserTeamMembership extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Zugehöriger Mitarbeiter.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Muss auf eine OrgUnit vom Typ TEAM zeigen.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_org_unit_id", nullable = false)
    private OrgUnit teamOrgUnit;

    @Enumerated(EnumType.STRING)
    @Column(name = "membership_type", nullable = false, length = 50)
    private TeamMembershipType membershipType = TeamMembershipType.MITGLIED;

    /**
     * Primäre Teamzugehörigkeit für UX / Default-Auswahl.
     */
    @Column(name = "is_primary", nullable = false)
    private boolean primary = false;

    @Column(nullable = false)
    private boolean enabled = true;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public OrgUnit getTeamOrgUnit() {
        return teamOrgUnit;
    }

    public void setTeamOrgUnit(OrgUnit teamOrgUnit) {
        this.teamOrgUnit = teamOrgUnit;
    }

    public TeamMembershipType getMembershipType() {
        return membershipType;
    }

    public void setMembershipType(TeamMembershipType membershipType) {
        this.membershipType = membershipType;
    }

    public boolean isPrimary() {
        return primary;
    }

    public void setPrimary(boolean primary) {
        this.primary = primary;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}