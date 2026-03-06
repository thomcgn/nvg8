package org.thomcgn.backend.falloeffnungen.meldung.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.util.Map;

public record MeldungSubmitRequest(
        Boolean mirrorToNotizen,
        Map<String, String> sectionReasons,
        @JsonAlias({"changeReason", "correctionReason"}) String changeReason
) {}


