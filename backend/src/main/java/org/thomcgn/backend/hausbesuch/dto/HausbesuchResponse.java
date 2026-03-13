package org.thomcgn.backend.hausbesuch.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public record HausbesuchResponse(
        Long id,
        Long falloeffnungId,
        LocalDate besuchsdatum,
        LocalTime besuchszeitVon,
        LocalTime besuchszeitBis,
        String anwesende,
        String whgOrdnung,
        String whgHygiene,
        String whgNahrungsversorgung,
        String whgUnfallgefahren,
        String whgSonstiges,
        String kindErscheinungsbild,
        String kindVerhalten,
        String kindStimmung,
        String kindAeusserungen,
        String kindHinweiseGefaehrdung,
        String bpErscheinungsbild,
        String bpVerhalten,
        String bpUmgangKind,
        String bpKooperation,
        String einschaetzungAmpel,
        String einschaetzungText,
        String naechsteSchritte,
        LocalDate naechsterTermin,
        String createdByDisplayName,
        Instant createdAt,
        Instant updatedAt
) {}
