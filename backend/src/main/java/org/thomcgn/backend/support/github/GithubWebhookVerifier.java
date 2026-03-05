package org.thomcgn.backend.support.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
@RequiredArgsConstructor
public class GithubWebhookVerifier {

    private final GithubProperties props;
    private final ObjectMapper om;

    public JsonNode parse(byte[] rawBody) {
        try {
            return om.readTree(rawBody);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON");
        }
    }

    public void verify(@Nullable String signatureHeader, byte[] rawBody) {
        String secret = props.webhookSecret();
        if (secret == null || secret.isBlank()) {
            // Wenn du lokal erst ohne Webhook arbeitest, kannst du hier auch "return;" machen
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "github.webhook-secret not configured");
        }

        if (signatureHeader == null || !signatureHeader.startsWith("sha256=")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing signature");
        }

        String expected = "sha256=" + hmacSha256Hex(secret, rawBody);

        if (!MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                signatureHeader.getBytes(StandardCharsets.UTF_8)
        )) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid signature");
        }
    }

    private String hmacSha256Hex(String secret, byte[] data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] out = mac.doFinal(data);
            return toHex(out);
        } catch (Exception e) {
            throw new IllegalStateException("HMAC failed", e);
        }
    }

    private String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}