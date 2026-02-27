package org.thomcgn.backend.falloeffnungen.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record AddNotizRequest(
        String typ,
        @NotBlank String text,
        String visibility,
        List<String> anlassCodes,
        List<IndicatorLink> indicatorLinks
) {
    public record IndicatorLink(
            String indicatorId,
            Integer severity
    ) {}
}