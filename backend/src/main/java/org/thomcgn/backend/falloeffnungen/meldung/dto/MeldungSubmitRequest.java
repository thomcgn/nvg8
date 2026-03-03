package org.thomcgn.backend.falloeffnungen.meldung.dto;

import java.util.Map;

public record MeldungSubmitRequest(
        Boolean mirrorToNotizen,
        Map<String, String> sectionReasons
) {}