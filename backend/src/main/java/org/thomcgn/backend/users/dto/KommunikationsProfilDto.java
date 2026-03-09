package org.thomcgn.backend.users.dto;

public record KommunikationsProfilDto(
        String mutterspracheCode,
        String bevorzugteSpracheCode,
        String dolmetschBedarf,
        String dolmetschSpracheCode,
        String hoerStatus,
        String codaStatus,
        String gebaerdenspracheCode,
        String kommunikationsHinweise
) {}