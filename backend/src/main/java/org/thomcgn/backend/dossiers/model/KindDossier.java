package org.thomcgn.backend.dossiers.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.people.model.Kind;
import org.thomcgn.backend.tenants.model.Traeger;

@Entity
@Table(
        name = "kind_dossiers",
        uniqueConstraints = @UniqueConstraint(name="uk_dossier_traeger_kind", columnNames = {"traeger_id", "kind_id"}),
        indexes = {
                @Index(name="ix_dossier_traeger", columnList="traeger_id"),
                @Index(name="ix_dossier_kind", columnList="kind_id")
        }
)
public class KindDossier extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="traeger_id", nullable = false)
    private Traeger traeger;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="kind_id", nullable = false)
    private Kind kind;

    @Column(nullable = false)
    private boolean enabled = true;

    public Long getId() { return id; }
    public Traeger getTraeger() { return traeger; }
    public void setTraeger(Traeger traeger) { this.traeger = traeger; }
    public Kind getKind() { return kind; }
    public void setKind(Kind kind) { this.kind = kind; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}