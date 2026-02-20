package org.thomcgn.backend.auth.dto;

import java.util.List;

public record LoginResponse(
        String baseToken,
        List<AvailableContextDto> contexts
) {}
