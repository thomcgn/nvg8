package org.thomcgn.backend.people.dto;

import java.time.LocalDate;

public record DuplicateItem(
        Long id,
        String displayName,
        LocalDate geburtsdatum
) {}