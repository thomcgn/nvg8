package org.thomcgn.backend.invites.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.users.model.User;

import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@Table(
        name = "invites",
        indexes = {
                @Index(name = "ix_invite_token_hash", columnList = "token_hash"),
                @Index(name = "ix_invite_email", columnList = "email"),
                @Index(name = "ix_invite_expires", columnList = "expires_at"),
                @Index(name = "ix_invite_token_active", columnList = "token_hash, revoked, used_at")
        }
)
public class Invite extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;


    @Column(nullable = false, length = 254)
    private String email;

    // SHA-256 Hash (64 hex chars)
    @Column(name = "token_hash", nullable = false, length = 64, unique = true)
    private String tokenHashHex;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "traeger_id", nullable = false)
    private Traeger traeger;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_unit_id", nullable = false)
    private OrgUnit orgUnit;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "invite_roles", joinColumns = @JoinColumn(name = "invite_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 40)
    private Set<Role> roles = new HashSet<>();

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accepted_by_user_id")
    private User acceptedBy;

    @Column(nullable = false)
    private boolean revoked = false;

    public Invite() {
        // JPA
    }

    public Invite(
            String email,
            String tokenHashHex,
            Traeger traeger,
            OrgUnit orgUnit,
            Set<Role> roles,
            Instant expiresAt,
            User createdBy
    ) {
        this.email = Objects.requireNonNull(email);
        this.tokenHashHex = Objects.requireNonNull(tokenHashHex);
        this.traeger = Objects.requireNonNull(traeger);
        this.orgUnit = Objects.requireNonNull(orgUnit);
        this.roles = new HashSet<>(Objects.requireNonNull(roles));
        this.expiresAt = Objects.requireNonNull(expiresAt);
        this.createdBy = createdBy;
    }

    // --------------------
    // Domain Logic
    // --------------------

    public boolean isActive(Instant now) {
        return !revoked
                && usedAt == null
                && now.isBefore(expiresAt);
    }

    public void revoke() {
        if (usedAt != null) {
            throw new IllegalStateException("Cannot revoke an already used invite.");
        }
        this.revoked = true;
    }

    public void markAsUsed(User user, Instant now) {
        if (revoked) {
            throw new IllegalStateException("Cannot use a revoked invite.");
        }
        if (usedAt != null) {
            throw new IllegalStateException("Invite already used.");
        }
        if (now.isAfter(expiresAt)) {
            throw new IllegalStateException("Invite expired.");
        }

        this.usedAt = now;
        this.acceptedBy = Objects.requireNonNull(user);
    }

    // --------------------
    // Getters (no public setters!)
    // --------------------

    public Traeger getTraeger() {
        return traeger;
    }

    public OrgUnit getOrgUnit() {
        return orgUnit;
    }

    public Set<Role> getRoles() {
        return Collections.unmodifiableSet(roles);
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getUsedAt() {
        return usedAt;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public User getAcceptedBy() {
        return acceptedBy;
    }

    public boolean isRevoked() {
        return revoked;
    }
}