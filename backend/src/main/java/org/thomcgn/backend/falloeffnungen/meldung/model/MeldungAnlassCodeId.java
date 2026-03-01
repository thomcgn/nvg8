package org.thomcgn.backend.falloeffnungen.meldung.model;

import java.io.Serializable;
import java.util.Objects;

public class MeldungAnlassCodeId implements Serializable {

    private Long meldung;
    private String code;

    public MeldungAnlassCodeId() {}

    public MeldungAnlassCodeId(Long meldung, String code) {
        this.meldung = meldung;
        this.code = code;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MeldungAnlassCodeId that)) return false;
        return Objects.equals(meldung, that.meldung) && Objects.equals(code, that.code);
    }

    @Override
    public int hashCode() {
        return Objects.hash(meldung, code);
    }
}