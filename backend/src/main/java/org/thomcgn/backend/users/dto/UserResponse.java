package org.thomcgn.backend.users.dto;

public record UserResponse(
        Long id,
        String email,
        String displayName,
        boolean enabled
) {}