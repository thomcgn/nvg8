package org.thomcgn.backend.common.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security.jwt")
public class JwtProperties {
    private String secret;
    private String issuer;
    private long baseTtlMinutes = 60;
    private long accessTtlMinutes = 240;

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }

    public String getIssuer() { return issuer; }
    public void setIssuer(String issuer) { this.issuer = issuer; }

    public long getBaseTtlMinutes() { return baseTtlMinutes; }
    public void setBaseTtlMinutes(long baseTtlMinutes) { this.baseTtlMinutes = baseTtlMinutes; }

    public long getAccessTtlMinutes() { return accessTtlMinutes; }
    public void setAccessTtlMinutes(long accessTtlMinutes) { this.accessTtlMinutes = accessTtlMinutes; }
}