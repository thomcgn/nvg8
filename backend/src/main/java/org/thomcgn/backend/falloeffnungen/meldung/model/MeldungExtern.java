package org.thomcgn.backend.falloeffnungen.meldung.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

import java.time.Instant;

@Entity
@Table(name="meldung_extern", indexes = {
        @Index(name="ix_meldung_extern_meldung", columnList="meldung_id")
})
public class MeldungExtern extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="meldung_id", nullable = false)
    private Meldung meldung;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ExterneStelle stelle;

    @Column(name="stelle_sonstiges", columnDefinition = "text")
    private String stelleSonstiges;

    private Instant am;

    @Column(columnDefinition = "text")
    private String begruendung;

    @Column(columnDefinition = "text")
    private String ergebnis;

    public Long getId() { return id; }

    public Meldung getMeldung() { return meldung; }
    public void setMeldung(Meldung meldung) { this.meldung = meldung; }

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