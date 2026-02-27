package org.thomcgn.backend.falloeffnungen.erstmeldung.dto;

import org.thomcgn.backend.falloeffnungen.erstmeldung.model.ErstmeldungStatus;

import java.time.Instant;

public record ErstmeldungVersionListItemResponse(
        Long id,
        int versionNo,
        boolean current,
        ErstmeldungStatus status,
        Instant erfasstAm,
        Instant submittedAt
) {}