package org.thomcgn.backend.tenants.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

@Entity
@Table(
        name = "traeger",
        uniqueConstraints = @UniqueConstraint(name = "uk_traeger_slug", columnNames = "slug")
)
public class Traeger extends AuditableEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 80)
    private String slug;

    @Column(nullable = false, length = 200)
    private String aktenPrefix;

    @Column(nullable = false)
    private boolean enabled = true;


    public String getAktenPrefix(){return aktenPrefix;}
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public boolean isEnabled() { return enabled; }

    public void setName(String name) { this.name = name; }
    public void setSlug(String slug) { this.slug = slug; }
    public void setAktenPrefix(String aktenPrefix){this.aktenPrefix = aktenPrefix;}
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}