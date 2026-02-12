package org.thomcgn.backend.kinderschutz.catalog;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor // JPA
public class ApplicabilityRule {

    private Integer minAgeMonths;
    private Integer maxAgeMonths;

    private Boolean requiresSchoolContext;
    private Boolean requiresKitaContext;

    public ApplicabilityRule(Integer minAgeMonths,
                             Integer maxAgeMonths,
                             Boolean requiresSchoolContext,
                             Boolean requiresKitaContext) {
        this.minAgeMonths = minAgeMonths;
        this.maxAgeMonths = maxAgeMonths;
        this.requiresSchoolContext = requiresSchoolContext;
        this.requiresKitaContext = requiresKitaContext;
    }

    /**
     * Anwendbarkeit anhand Alter + Kontext (Schule/Kita).
     * - null gilt als "keine Einschränkung"
     */
    public boolean isApplicable(int ageMonths, boolean schoolContext, boolean kitaContext) {
        if (minAgeMonths != null && ageMonths < minAgeMonths) return false;
        if (maxAgeMonths != null && ageMonths > maxAgeMonths) return false;

        if (Boolean.TRUE.equals(requiresSchoolContext) && !schoolContext) return false;
        return !Boolean.TRUE.equals(requiresKitaContext) || kitaContext;
    }
}
