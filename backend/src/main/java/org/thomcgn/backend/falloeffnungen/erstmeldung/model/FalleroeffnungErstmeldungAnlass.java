package org.thomcgn.backend.falloeffnungen.erstmeldung.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

@Entity
@Table(
        name = "falloeffnung_erstmeldung_anlaesse",
        indexes = @Index(name = "ix_erstmeldung_anlass_code", columnList = "code")
)
@IdClass(FalleroeffnungErstmeldungAnlassId.class)
public class FalleroeffnungErstmeldungAnlass extends AuditableEntity {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "erstmeldung_id", nullable = false)
    private FalleroeffnungErstmeldung erstmeldung;

    @Id
    @Column(nullable = false, length = 80)
    private String code;

    public FalleroeffnungErstmeldung getErstmeldung() { return erstmeldung; }
    public void setErstmeldung(FalleroeffnungErstmeldung erstmeldung) { this.erstmeldung = erstmeldung; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}