package org.thomcgn.backend.auth.dto;

import java.util.List;

public record MeResponse(
        Long userId,
        String email,
        String displayName,
        boolean contextActive,
        Long traegerId,
        Long orgUnitId,
        List<String> roles
) {}