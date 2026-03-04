package org.thomcgn.backend.people.dto;

import java.time.LocalDate;

public record KindMini(
        Long id,
        String kindVorname,
        String kindNachname,
        LocalDate geburtsdatum
) {}