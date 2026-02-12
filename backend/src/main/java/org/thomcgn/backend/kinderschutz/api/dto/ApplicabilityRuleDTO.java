package org.thomcgn.backend.kinderschutz.api.dto;

public record ApplicabilityRuleDTO(
        Integer minAgeMonths,
        Integer maxAgeMonths,
        boolean requiresSchoolContext,
        boolean requiresKitaContext
) {}
