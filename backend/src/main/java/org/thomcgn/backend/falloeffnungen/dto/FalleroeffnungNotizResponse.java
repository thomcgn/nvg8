package org.thomcgn.backend.falloeffnungen.dto;

import java.time.Instant;
import java.util.List;

public record FalleroeffnungNotizResponse(
        Long id,
        String typ,
        String text,
        String createdByDisplayName,
        Instant createdAt,
        List<String> anlassCodes,
        List<IndicatorLink> indicatorLinks
) {
    public record IndicatorLink(String indicatorId, Integer severity) {}
}