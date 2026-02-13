package org.thomcgn.backend.kinderschutz.api.dto;

import java.util.Map;

public record KSFormInstanceDTO(
        Long id,
        Long instrumentId,
        Long fallId,
        Long version,
        String status,
        Map<String, String> answersByItemNo // itemNo -> valueString (z.B. "YES"/"NO"/"UNKNOWN" oder Freitext)
) {}
