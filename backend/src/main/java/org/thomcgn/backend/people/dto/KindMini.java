package org.thomcgn.backend.people.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;

public record KindMini(
        Long id,
        String kindVorname,
        String kindNachname,
        LocalDate geburtsdatum
) {
    @JsonProperty("displayName")
    public String displayName() {
        String v = kindVorname != null ? kindVorname : "";
        String n = kindNachname != null ? kindNachname : "";
        return (v + " " + n).trim();
    }
}