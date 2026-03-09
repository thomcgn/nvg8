package org.thomcgn.backend.anlass.dto;

import java.util.List;

public record AnlasskatalogSimilarResponse(
        boolean exactMatch,
        List<AnlasskatalogEntryResponse> similar
) {}
