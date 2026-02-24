package org.thomcgn.backend.s8a.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

/**
 * Abbildung rechtlicher Konstellation bezogen auf ein Kind und eine Person.
 * Beispiel: Mutter hat gemeinsames Sorgerecht + gemeinsames Aufenthaltsbestimmungsrecht.
 *
 * Enthält Quellen-/Gültigkeitsinformationen (Beschluss, Datum, Aktenzeichen) -> Nachvollziehbarkeit.
 */
@Entity
@Table(
        name = "s8a_custody_records",
        indexes = {
                @Index(name = "ix_s8a_cust_case", columnList = "s8a_case_id"),
                @Index(name = "ix_s8a_cust_child", columnList = "child_person_id"),
                @Index(name = "ix_s8a_cust_holder", columnList = "right_holder_person_id")
        }
)
public class S8aCustodyRecord extends AuditableEntity {

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
    @JoinColumn(name = "right_holder_person_id", nullable = false)
    private S8aCasePerson rightHolderPerson;

    @Enumerated(EnumType.STRING)
    @Column(name = "custody_type", nullable = false, length = 30)
    private S8aCustodyType custodyType;

    @Enumerated(EnumType.STRING)
    @Column(name = "residence_right", nullable = false, length = 40)
    private S8aResidenceDeterminationRight residenceRight;

    @Column(name = "valid_from", length = 20)
    private String validFrom; // ISO date

    @Column(name = "valid_to", length = 20)
    private String validTo;

    @Column(name = "source_title", length = 250)
    private String sourceTitle; // z.B. "Beschluss Familiengericht"

    @Column(name = "source_reference", length = 120)
    private String sourceReference; // Aktenzeichen o.ä.

    @Column(name = "notes", length = 2000)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_order_id")
    private S8aOrder sourceOrder;

    public S8aOrder getSourceOrder() { return sourceOrder; }
    public void setSourceOrder(S8aOrder sourceOrder) { this.sourceOrder = sourceOrder; }

    public Long getId() { return id; }

    public S8aCase getS8aCase() { return s8aCase; }
    public void setS8aCase(S8aCase s8aCase) { this.s8aCase = s8aCase; }

    public S8aCasePerson getChildPerson() { return childPerson; }
    public void setChildPerson(S8aCasePerson childPerson) { this.childPerson = childPerson; }

    public S8aCasePerson getRightHolderPerson() { return rightHolderPerson; }
    public void setRightHolderPerson(S8aCasePerson rightHolderPerson) { this.rightHolderPerson = rightHolderPerson; }

    public S8aCustodyType getCustodyType() { return custodyType; }
    public void setCustodyType(S8aCustodyType custodyType) { this.custodyType = custodyType; }

    public S8aResidenceDeterminationRight getResidenceRight() { return residenceRight; }
    public void setResidenceRight(S8aResidenceDeterminationRight residenceRight) { this.residenceRight = residenceRight; }

    public String getValidFrom() { return validFrom; }
    public void setValidFrom(String validFrom) { this.validFrom = validFrom; }

    public String getValidTo() { return validTo; }
    public void setValidTo(String validTo) { this.validTo = validTo; }

    public String getSourceTitle() { return sourceTitle; }
    public void setSourceTitle(String sourceTitle) { this.sourceTitle = sourceTitle; }

    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}