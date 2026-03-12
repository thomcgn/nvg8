package org.thomcgn.backend.auth.dto;

import java.util.List;

public record LoginResponse(
        String baseToken,
        List<AvailableContextDto> contexts,
        boolean systemAdmin,
        String systemToken   // non-null only for SYSTEM_ADMIN; wird als Access-Cookie gesetzt
) {}
