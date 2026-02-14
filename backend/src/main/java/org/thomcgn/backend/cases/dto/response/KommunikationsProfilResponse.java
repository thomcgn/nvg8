package org.thomcgn.backend.cases.dto.response;

public record KommunikationsProfilResponse(
        String mutterspracheCode,
        String bevorzugteSpracheCode,
        String dolmetschBedarf,
        String dolmetschSpracheCode,
        String hoerStatus,
        String codaStatus,
        String gebaerdenspracheCode,
        String kommunikationsHinweise
) {}