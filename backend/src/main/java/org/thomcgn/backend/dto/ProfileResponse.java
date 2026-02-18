package org.thomcgn.backend.dto;

public record ProfileResponse(
        String vorname,
        String nachname,
        String email,
        String telefon
) {}