package org.thomcgn.backend.people.dto;

import java.util.List;

public record CreateKindCompleteRequest(
        CreateKindRequest kind,
        List<AddKindBezugspersonRequest> bezugspersonen
) {}