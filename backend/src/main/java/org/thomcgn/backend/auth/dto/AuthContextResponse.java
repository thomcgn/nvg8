package org.thomcgn.backend.auth.dto;

import java.util.Set;

public record AuthContextResponse(
        Long traegerId,
        String traegerName,
        Long einrichtungOrgUnitId,
        String einrichtungName,
        Set<String> roles
) {}