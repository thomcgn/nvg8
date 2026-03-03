package org.thomcgn.backend.users.dto;

import java.util.Set;

public record UserListItemResponse(
        Long id,
        String email,
        String displayName,
        boolean enabled,
        Set<String> roles
) {}