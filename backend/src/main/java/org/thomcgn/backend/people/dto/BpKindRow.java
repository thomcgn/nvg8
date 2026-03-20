package org.thomcgn.backend.people.dto;

import org.thomcgn.backend.people.model.SorgerechtTyp;

import java.time.LocalDate;

public record BpKindRow(
        Long bezugspersonId,
        Long kindId,
        String kindVorname,
        String kindNachname,
        LocalDate kindGeburtsdatum,
        SorgerechtTyp sorgerecht
) {}