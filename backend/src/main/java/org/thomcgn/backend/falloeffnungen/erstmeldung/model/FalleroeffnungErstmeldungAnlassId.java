package org.thomcgn.backend.falloeffnungen.erstmeldung.model;

import java.io.Serializable;
import java.util.Objects;

public class FalleroeffnungErstmeldungAnlassId implements Serializable {

    private Long erstmeldung;
    private String code;

    public FalleroeffnungErstmeldungAnlassId() {}

    public FalleroeffnungErstmeldungAnlassId(Long erstmeldung, String code) {
        this.erstmeldung = erstmeldung;
        this.code = code;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FalleroeffnungErstmeldungAnlassId that)) return false;
        return Objects.equals(erstmeldung, that.erstmeldung) && Objects.equals(code, that.code);
    }

    @Override
    public int hashCode() {
        return Objects.hash(erstmeldung, code);
    }
}