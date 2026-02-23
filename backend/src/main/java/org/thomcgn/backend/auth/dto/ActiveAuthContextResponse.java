package org.thomcgn.backend.auth.dto;

import java.util.Set;

public record ActiveAuthContextResponse(
        Long traegerId,
        Long einrichtungOrgUnitId,
        Set<String> roles
) {}