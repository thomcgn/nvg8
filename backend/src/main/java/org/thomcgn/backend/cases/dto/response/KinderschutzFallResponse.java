package org.thomcgn.backend.cases.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record KinderschutzFallResponse(
        Long id,
        Long version,
        String aktenzeichen,

        KindSummaryResponse kind,
        UserSummaryResponse zustaendigeFachkraft,
        UserSummaryResponse teamleitung,

        String status,
        List<String> gefaehrdungsbereiche,
        String letzteEinschaetzung,

        Boolean iefkPflichtig,
        Boolean gerichtEingeschaltet,
        Boolean inobhutnahmeErfolgt,

        String kurzbeschreibung,

        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}