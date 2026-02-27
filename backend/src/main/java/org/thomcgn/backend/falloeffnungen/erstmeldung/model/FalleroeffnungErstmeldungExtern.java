package org.thomcgn.backend.falloeffnungen.erstmeldung.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

import java.time.Instant;

@Entity
@Table(
        name = "falloeffnung_erstmeldung_extern",
        indexes = @Index(name = "ix_erstmeldung_extern_erstmeldung", columnList = "erstmeldung_id")
)
public class FalleroeffnungErstmeldungExtern extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "erstmeldung_id", nullable = false)
    private FalleroeffnungErstmeldung erstmeldung;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ExterneStelle stelle;

    @Column(name = "stelle_sonstiges", columnDefinition = "text")
    private String stelleSonstiges;

    @Column(name = "am")
    private Instant am;

    @Column(columnDefinition = "text")
    private String begruendung;

    @Column(columnDefinition = "text")
    private String ergebnis;

    public Long getId() { return id; }

    public FalleroeffnungErstmeldung getErstmeldung() { return erstmeldung; }
    public void setErstmeldung(FalleroeffnungErstmeldung erstmeldung) { this.erstmeldung = erstmeldung; }

    public ExterneStelle getStelle() { return stelle; }
    public void setStelle(ExterneStelle stelle) { this.stelle = stelle; }

    public String getStelleSonstiges() { return stelleSonstiges; }
    public void setStelleSonstiges(String stelleSonstiges) { this.stelleSonstiges = stelleSonstiges; }

    public Instant getAm() { return am; }
    public void setAm(Instant am) { this.am = am; }

    public String getBegruendung() { return begruendung; }
    public void setBegruendung(String begruendung) { this.begruendung = begruendung; }

    public String getErgebnis() { return ergebnis; }
    public void setErgebnis(String ergebnis) { this.ergebnis = ergebnis; }
}