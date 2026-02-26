package org.thomcgn.backend.s8a.dto;

public record S8aOrderResponse(
        Long id,
        String orderType,
        String title,
        String issuedBy,
        String issuedAt,
        String expiresAt,
        String reference,
        String notes
) {}