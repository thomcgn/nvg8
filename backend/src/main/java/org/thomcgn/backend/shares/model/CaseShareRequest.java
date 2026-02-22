package org.thomcgn.backend.shares.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.users.model.User;

import java.time.Instant;

@Entity
@Table(name = "case_share_requests")
public class CaseShareRequest extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="partner_id", nullable = false)
    private ExternalPartner partner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="falloeffnung_id", nullable = false)
    private Falleroeffnung falleroeffnung;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="owning_traeger_id", nullable = false)
    private Traeger owningTraeger;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="owning_einrichtung_org_unit_id", nullable = false)
    private OrgUnit owningEinrichtung;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="requested_by_user_id", nullable = false)
    private User requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ShareRequestStatus status = ShareRequestStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private LegalBasisType legalBasisType = LegalBasisType.UNKLAR;

    @Column(nullable = false, length = 1000)
    private String purpose;

    private Instant notesFrom;
    private Instant notesTo;

    private Instant decidedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="decided_by_user_id")
    private User decidedBy;

    @Column(length = 1000)
    private String decisionReason;

    public Long getId() { return id; }

    public ExternalPartner getPartner() { return partner; }
    public void setPartner(ExternalPartner partner) { this.partner = partner; }

    public Falleroeffnung getFalleroeffnung() { return falleroeffnung; }
    public void setFalleroeffnung(Falleroeffnung falleroeffnung) { this.falleroeffnung = falleroeffnung; } // ✅

    public Traeger getOwningTraeger() { return owningTraeger; }
    public void setOwningTraeger(Traeger owningTraeger) { this.owningTraeger = owningTraeger; }

    public OrgUnit getOwningEinrichtung() { return owningEinrichtung; }
    public void setOwningEinrichtung(OrgUnit owningEinrichtung) { this.owningEinrichtung = owningEinrichtung; }

    public User getRequestedBy() { return requestedBy; }
    public void setRequestedBy(User requestedBy) { this.requestedBy = requestedBy; }

    public ShareRequestStatus getStatus() { return status; }
    public void setStatus(ShareRequestStatus status) { this.status = status; }

    public LegalBasisType getLegalBasisType() { return legalBasisType; }
    public void setLegalBasisType(LegalBasisType legalBasisType) { this.legalBasisType = legalBasisType; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public Instant getNotesFrom() { return notesFrom; }
    public void setNotesFrom(Instant notesFrom) { this.notesFrom = notesFrom; }

    public Instant getNotesTo() { return notesTo; }
    public void setNotesTo(Instant notesTo) { this.notesTo = notesTo; }

    public Instant getDecidedAt() { return decidedAt; }
    public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }

    public User getDecidedBy() { return decidedBy; }
    public void setDecidedBy(User decidedBy) { this.decidedBy = decidedBy; }

    public String getDecisionReason() { return decisionReason; }
    public void setDecisionReason(String decisionReason) { this.decisionReason = decisionReason; }
}