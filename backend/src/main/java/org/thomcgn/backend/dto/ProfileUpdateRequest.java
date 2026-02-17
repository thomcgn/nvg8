package org.thomcgn.backend.dto;

public record ProfileUpdateRequest(
        String vorname,
        String nachname,
        String email,
        String telefon
) {}