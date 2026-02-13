package org.thomcgn.backend.kinderschutz.api.dto;

import java.util.Map;

public record SaveAnswersRequest(
        Long expectedVersion,
        Map<String, String> answersByItemNo
) {}
