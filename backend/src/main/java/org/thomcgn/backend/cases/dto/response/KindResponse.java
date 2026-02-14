package org.thomcgn.backend.cases.dto.response;

import java.util.List;

public record KindResponse(
        Long id,
        String geburtsdatum,
        PersonResponseBase person,
        List<KindBezugspersonRelationResponse> bezugspersonen
) {}