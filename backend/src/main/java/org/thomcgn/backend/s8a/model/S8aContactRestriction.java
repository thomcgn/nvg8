package org.thomcgn.backend.s8a.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

/**
 * Umgang / Kontaktbeschränkung zwischen Kind und Person.
 * Beispiel: Vater darf nur begleitet Kontakt haben.
 * Beispiel: vollständige Kontaktsperre mit Schutzgrund.
 */
@Entity
@Table(
        name = "s8a_contact_restrictions",
        indexes = {
                @Index(name = "ix_s8a_contact_case", columnList = "s8a_case_id"),
                @Index(name = "ix_s8a_contact_child", columnList = "child_person_id"),
                @Index(name = "ix_s8a_contact_other", columnList = "other_person_id")
        }
)
public class S8aContactRestriction extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "s8a_case_id", nullable = false)
    private S8aCase s8aCase;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "child_person_id", nullable = false)
    private S8aCasePerson childPerson;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "other_person_id", nullable = false)
    private S8aCasePerson otherPerson;

    @Enumerated(EnumType.STRING)
    @Column(name = "restriction_type", nullable = false, length = 40)
    private S8aContactRestrictionType restrictionType;

    @Column(name = "reason", length = 2000)
    private String reason;

    @Column(name = "valid_from", length = 20)
    private String validFrom;

    @Column(name = "valid_to", length = 20)
    private String validTo;

    @Column(name = "source_title", length = 250)
    private String sourceTitle;

    @Column(name = "source_reference", length = 120)
    private String sourceReference;

    public Long getId() { return id; }

    public S8aCase getS8aCase() { return s8aCase; }
    public void setS8aCase(S8aCase s8aCase) { this.s8aCase = s8aCase; }

    public S8aCasePerson getChildPerson() { return childPerson; }
    public void setChildPerson(S8aCasePerson childPerson) { this.childPerson = childPerson; }

    public S8aCasePerson getOtherPerson() { return otherPerson; }
    public void setOtherPerson(S8aCasePerson otherPerson) { this.otherPerson = otherPerson; }

    public S8aContactRestrictionType getRestrictionType() { return restrictionType; }
    public void setRestrictionType(S8aContactRestrictionType restrictionType) { this.restrictionType = restrictionType; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getValidFrom() { return validFrom; }
    public void setValidFrom(String validFrom) { this.validFrom = validFrom; }

    public String getValidTo() { return validTo; }
    public void setValidTo(String validTo) { this.validTo = validTo; }

    public String getSourceTitle() { return sourceTitle; }
    public void setSourceTitle(String sourceTitle) { this.sourceTitle = sourceTitle; }

    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }
}