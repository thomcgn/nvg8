package org.thomcgn.backend.s8a.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

/**
 * "Verfügung / Beschluss / Anordnung" im Kontext §8a (Gericht, Jugendamt, Polizei etc.)
 * Wird bewusst als eigenes Objekt geführt, damit man später referenzieren kann
 * (z.B. custodyRecord.sourceReference).
 */
@Entity
@Table(
        name = "s8a_orders",
        indexes = {
                @Index(name = "ix_s8a_order_case", columnList = "s8a_case_id"),
                @Index(name = "ix_s8a_order_type", columnList = "order_type")
        }
)
public class S8aOrder extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "s8a_case_id", nullable = false)
    private S8aCase s8aCase;

    @Column(name = "order_type", nullable = false, length = 80)
    private String orderType; // bewusst String (zu viele reale Typen, die sich ändern)

    @Column(name = "title", nullable = false, length = 250)
    private String title;

    @Column(name = "issued_by", length = 200)
    private String issuedBy; // "Familiengericht Berlin", "Jugendamt X"

    @Column(name = "issued_at", length = 20)
    private String issuedAt;

    @Column(name = "expires_at", length = 20)
    private String expiresAt;

    @Column(name = "reference", length = 120)
    private String reference; // Aktenzeichen

    @Column(name = "notes", length = 4000)
    private String notes;

    public Long getId() { return id; }

    public S8aCase getS8aCase() { return s8aCase; }
    public void setS8aCase(S8aCase s8aCase) { this.s8aCase = s8aCase; }

    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getIssuedBy() { return issuedBy; }
    public void setIssuedBy(String issuedBy) { this.issuedBy = issuedBy; }

    public String getIssuedAt() { return issuedAt; }
    public void setIssuedAt(String issuedAt) { this.issuedAt = issuedAt; }

    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}