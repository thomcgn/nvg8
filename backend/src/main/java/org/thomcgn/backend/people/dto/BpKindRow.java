package org.thomcgn.backend.people.dto;

import java.time.LocalDate;

public record BpKindRow(
        Long bezugspersonId,
        Long kindId,
        String kindVorname,
        String kindNachname,
        LocalDate kindGeburtsdatum
) {}