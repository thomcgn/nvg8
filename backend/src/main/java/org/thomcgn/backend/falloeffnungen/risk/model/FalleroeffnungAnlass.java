package org.thomcgn.backend.falloeffnungen.risk.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;

@Entity
@Table(
        name = "falloeffnung_anlaesse",
        indexes = {
                @Index(name = "ix_fall_anlass_code", columnList = "code")
        }
)
@IdClass(FalleroeffnungAnlassId.class)
public class FalleroeffnungAnlass extends AuditableEntity {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "falloeffnung_id", nullable = false)
    private Falleroeffnung falleroeffnung;

    @Id
    @Column(nullable = false, length = 80)
    private String code;

    public Falleroeffnung getFalleroeffnung() { return falleroeffnung; }
    public void setFalleroeffnung(Falleroeffnung falleroeffnung) { this.falleroeffnung = falleroeffnung; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}