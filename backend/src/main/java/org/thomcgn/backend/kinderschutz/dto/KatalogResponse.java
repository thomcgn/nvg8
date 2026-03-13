package org.thomcgn.backend.kinderschutz.dto;

import java.util.List;

public record KatalogResponse(
        String altersgruppe,
        String altergruppeLabel,
        List<KatalogItemResponse> items
) {
    public record KatalogItemResponse(String code, String label, String bereich, String bereichLabel) {}
}
