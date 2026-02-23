package org.thomcgn.backend.auth.dto;

import java.util.List;

public record AuthContextOverviewResponse(
        ActiveAuthContextResponse active,
        List<AuthContextResponse> available
) {}