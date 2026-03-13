package org.thomcgn.backend.dji.dto;

import java.util.List;

public record DjiKatalogResponse(
        String formTyp,
        String formTypLabel,
        String beschreibung,
        List<GesamtOption> gesamteinschaetzungOptionen,
        List<KatalogItem> positionen
) {

    public record GesamtOption(String code, String label) {}

    public record KatalogItem(
            String code,
            String label,
            String bereich,
            String bewertungstyp
    ) {}
}
