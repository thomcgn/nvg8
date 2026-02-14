package org.thomcgn.backend.cases.dto.response;

public record KindBezugspersonRelationResponse(
        Long relationId,
        BezugspersonSummaryResponse bezugsperson,
        String rolleImAlltag,
        String beziehungstyp,
        String sorgeStatus,
        Boolean lebtImHaushalt
) {}