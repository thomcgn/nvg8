package org.thomcgn.backend.people.dto;

import java.time.LocalDate;

public record EndKindBezugspersonRequest(
        LocalDate validTo // required (oder optional mit default today – ich empfehle required)
) {}