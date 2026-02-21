package org.thomcgn.backend.invites.dto;

import java.util.List;

public record AcceptInviteResponse(
        String baseToken,
        String accessToken,
        Long userId,
        Long traegerId,
        Long orgUnitId,
        List<String> roles
) {}