package org.thomcgn.backend.s8a.dto;

import java.util.List;

public record S8aCaseResponse(
        Long id,
        Long falloeffnungId,
        String status,
        String riskLevel,
        String title,
        String createdByDisplayName,
        List<S8aEventResponse> events
) {}