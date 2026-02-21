package org.thomcgn.backend.shares.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

import java.time.Instant;

@Entity
@Table(
        name = "case_transfer_packages",
        indexes = {
                @Index(name="ix_pkg_req", columnList="share_request_id"),
                @Index(name="ix_pkg_token_hash", columnList="token_hash"),
                @Index(name="ix_pkg_expires", columnList="expires_at")
        }
)
public class CaseTransferPackage extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="share_request_id", nullable = false, unique = true)
    private CaseShareRequest shareRequest;

    @Column(name="expires_at", nullable = false)
    private Instant expiresAt;

    // Snapshot (JSON) – später ggf. als JSONB in Postgres
    @Lob
    @Column(name="payload_json", nullable = false)
    private String payloadJson;

    // Zugriff per Magic-Link: token wird NICHT gespeichert, nur Hash
    @Column(name="token_hash", nullable = false, length = 64)
    private String tokenHashHex;

    @Column(name="max_downloads", nullable = false)
    private int maxDownloads = 5;

    @Column(name="download_count", nullable = false)
    private int downloadCount = 0;

    public Long getId() { return id; }
    public CaseShareRequest getShareRequest() { return shareRequest; }
    public void setShareRequest(CaseShareRequest shareRequest) { this.shareRequest = shareRequest; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public String getPayloadJson() { return payloadJson; }
    public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }
    public String getTokenHashHex() { return tokenHashHex; }
    public void setTokenHashHex(String tokenHashHex) { this.tokenHashHex = tokenHashHex; }
    public int getMaxDownloads() { return maxDownloads; }
    public void setMaxDownloads(int maxDownloads) { this.maxDownloads = maxDownloads; }
    public int getDownloadCount() { return downloadCount; }
    public void setDownloadCount(int downloadCount) { this.downloadCount = downloadCount; }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean canDownload() {
        return !isExpired() && downloadCount < maxDownloads;
    }
}