package org.thomcgn.backend.users.model;

import jakarta.persistence.*;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.tenants.model.Traeger;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
        name = "users",
        uniqueConstraints = @UniqueConstraint(name = "uk_users_email", columnNames = "email")
)
public class User extends Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    // Defaults nur für UX (nicht als Berechtigungsquelle!)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_traeger_id")
    private Traeger defaultTraeger;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_org_unit_id")
    private OrgUnit defaultOrgUnit;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserOrgRole> orgRoles = new HashSet<>();

    public Long getId() { return id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    public Traeger getDefaultTraeger() { return defaultTraeger; }
    public void setDefaultTraeger(Traeger defaultTraeger) { this.defaultTraeger = defaultTraeger; }

    public OrgUnit getDefaultOrgUnit() { return defaultOrgUnit; }
    public void setDefaultOrgUnit(OrgUnit defaultOrgUnit) { this.defaultOrgUnit = defaultOrgUnit; }

    public Set<UserOrgRole> getOrgRoles() { return orgRoles; }
    public void setOrgRoles(Set<UserOrgRole> orgRoles) { this.orgRoles = orgRoles; }

    // Convenience
    public String getDisplayName() {
        String first = getVorname() != null ? getVorname().trim() : "";
        String last  = getNachname() != null ? getNachname().trim() : "";
        String full  = (first + " " + last).trim();
        return full.isEmpty() ? email : full;
    }

    public String getUsername() { return email; }
}