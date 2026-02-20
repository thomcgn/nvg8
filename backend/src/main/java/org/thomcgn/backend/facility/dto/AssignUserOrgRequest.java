package org.thomcgn.backend.facility.dto;

import java.util.Set;

public record AssignUserOrgRequest(
        Long userId,
        Long facilityId,
        Long teamId,        // optional
        Set<Long> teamIds,  // optional
        Boolean replaceTeams // optional (null => default)
) {}
