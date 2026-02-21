package org.thomcgn.backend.faelle.dto;

import java.util.List;

public record FallResponse(
        Long id,
        String status,
        String titel,
        String kurzbeschreibung,
        Long traegerId,
        Long einrichtungOrgUnitId,
        Long teamOrgUnitId,
        String createdByDisplayName,
        List<FallNotizResponse> notizen
) {}