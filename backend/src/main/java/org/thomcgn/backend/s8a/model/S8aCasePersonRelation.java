package org.thomcgn.backend.s8a.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

/**
 * Beziehung zwischen zwei Case-Personen (z.B. Mutter von Kind, Geschwister von).
 */
@Entity
@Table(
        name = "s8a_case_person_relations",
        indexes = {
                @Index(name = "ix_s8a_rel_case", columnList = "s8a_case_id"),
                @Index(name = "ix_s8a_rel_from", columnList = "from_person_id"),
                @Index(name = "ix_s8a_rel_to", columnList = "to_person_id")
        }
)
public class S8aCasePersonRelation extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "s8a_case_id", nullable = false)
    private S8aCase s8aCase;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "from_person_id", nullable = false)
    private S8aCasePerson fromPerson;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "to_person_id", nullable = false)
    private S8aCasePerson toPerson;

    @Enumerated(EnumType.STRING)
    @Column(name = "relation_type", nullable = false, length = 40)
    private S8aRelationshipType relationType;

    @Column(name = "notes", length = 2000)
    private String notes;

    public Long getId() { return id; }

    public S8aCase getS8aCase() { return s8aCase; }
    public void setS8aCase(S8aCase s8aCase) { this.s8aCase = s8aCase; }

    public S8aCasePerson getFromPerson() { return fromPerson; }
    public void setFromPerson(S8aCasePerson fromPerson) { this.fromPerson = fromPerson; }

    public S8aCasePerson getToPerson() { return toPerson; }
    public void setToPerson(S8aCasePerson toPerson) { this.toPerson = toPerson; }

    public S8aRelationshipType getRelationType() { return relationType; }
    public void setRelationType(S8aRelationshipType relationType) { this.relationType = relationType; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}