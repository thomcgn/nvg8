package org.thomcgn.backend.support.github;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "github")
public record GithubProperties(
        String token,
        String owner,
        String repo,
        String webhookSecret
) {}