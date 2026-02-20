package org.thomcgn.backend.auth.dto;

public record LoginRequest(
        String email,
        String password,
        Long facilityId
) {}
