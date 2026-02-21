package org.thomcgn.backend.audit.dto;

import java.time.Instant;

public record AuditEventResponse(
        Long id,
        String action,
        String entityType,
        Long entityId,
        String userDisplayName,
        Long orgUnitId,
        String message,
        Instant createdAt
) {}