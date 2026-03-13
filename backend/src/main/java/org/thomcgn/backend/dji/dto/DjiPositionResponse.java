package org.thomcgn.backend.dji.dto;

public record DjiPositionResponse(
        String positionCode,
        String label,
        String bereich,
        String bewertungstyp,
        String belege,
        Boolean bewertungBool,
        Short bewertungStufe
) {}
