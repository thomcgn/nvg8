package org.thomcgn.backend.falloeffnungen.meldung.model;

import jakarta.persistence.*;

@Entity
@Table(name="meldung_anlass_codes",
        indexes = {
                @Index(name="ix_meldung_anlass_meldung", columnList="meldung_id"),
                @Index(name="ix_meldung_anlass_code", columnList="code")
        })
@IdClass(MeldungAnlassCodeId.class)
public class MeldungAnlassCode {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="meldung_id", nullable = false)
    private Meldung meldung;

    @Id
    @Column(length = 100)
    private String code;

    public Meldung getMeldung() { return meldung; }
    public void setMeldung(Meldung meldung) { this.meldung = meldung; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}