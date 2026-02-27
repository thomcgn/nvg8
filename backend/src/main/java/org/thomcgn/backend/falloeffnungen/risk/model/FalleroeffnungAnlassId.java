package org.thomcgn.backend.falloeffnungen.risk.model;

import java.io.Serializable;
import java.util.Objects;

public class FalleroeffnungAnlassId implements Serializable {

    private Long falleroeffnung; // maps to FalleroeffnungAnlass.falleroeffnung (its id)
    private String code;

    public FalleroeffnungAnlassId() {}

    public FalleroeffnungAnlassId(Long falleroeffnung, String code) {
        this.falleroeffnung = falleroeffnung;
        this.code = code;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FalleroeffnungAnlassId that)) return false;
        return Objects.equals(falleroeffnung, that.falleroeffnung) && Objects.equals(code, that.code);
    }

    @Override
    public int hashCode() {
        return Objects.hash(falleroeffnung, code);
    }
}