package org.thomcgn.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        boolean devMode,
        Cookie cookie
) {
    public record Cookie(
            String name,
            String domain,
            boolean secure,
            String sameSite,
            long maxAgeSeconds
    ) {}
}
