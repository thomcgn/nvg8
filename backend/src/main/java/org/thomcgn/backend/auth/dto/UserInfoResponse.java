package org.thomcgn.backend.auth.dto;

import java.time.LocalDateTime;

public record UserInfoResponse(
        String name,
        String role,
        LocalDateTime lastLogin
) {
}
