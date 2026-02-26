package org.thomcgn.backend.s8a.dto;

public record CreateS8aOrderRequest(
        String orderType,
        String title,
        String issuedBy,
        String issuedAt,
        String expiresAt,
        String reference,
        String notes
) {}