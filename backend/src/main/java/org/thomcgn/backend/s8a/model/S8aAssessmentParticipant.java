package org.thomcgn.backend.s8a.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

/**
 * Beteiligter innerhalb einer Assessment-Version (Snapshot!).
 *
 * Warum separate Tabelle?
 * - Querybar (z.B. "alle Assessments, in denen Person X beteiligt ist")
 * - Revisionssicher: Rechte/Status zum Zeitpunkt der Version sind eingefroren
 */
@Entity
@Table(
        name = "s8a_assessment_participants",
        indexes = {
                @Index(name = "ix_s8a_ap_assessment", columnList = "assessment_id"),
                @Index(name = "ix_s8a_ap_person", columnList = "case_person_id")
        }
)
public class S8aAssessmentParticipant extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assessment_id", nullable = false)
    private S8aAssessment assessment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "case_person_id", nullable = false)
    private S8aCasePerson casePerson;

    @Column(name = "role_in_assessment", nullable = false, length = 80)
    private String roleInAssessment; // z.B. "Kind", "Sorgeberechtigte", "ISEF", "Jugendamt"

    // Snapshot-Felder (zum Zeitpunkt der Version)
    @Column(name = "custody_snapshot", length = 2000)
    private String custodySnapshot;

    @Column(name = "residence_right_snapshot", length = 2000)
    private String residenceRightSnapshot;

    @Column(name = "contact_snapshot", length = 2000)
    private String contactSnapshot;

    @Column(name = "restriction_snapshot", length = 2000)
    private String restrictionSnapshot;

    @Column(name = "notes", length = 2000)
    private String notes;

    public Long getId() { return id; }

    public S8aAssessment getAssessment() { return assessment; }
    public void setAssessment(S8aAssessment assessment) { this.assessment = assessment; }

    public S8aCasePerson getCasePerson() { return casePerson; }
    public void setCasePerson(S8aCasePerson casePerson) { this.casePerson = casePerson; }

    public String getRoleInAssessment() { return roleInAssessment; }
    public void setRoleInAssessment(String roleInAssessment) { this.roleInAssessment = roleInAssessment; }

    public String getCustodySnapshot() { return custodySnapshot; }
    public void setCustodySnapshot(String custodySnapshot) { this.custodySnapshot = custodySnapshot; }

    public String getResidenceRightSnapshot() { return residenceRightSnapshot; }
    public void setResidenceRightSnapshot(String residenceRightSnapshot) { this.residenceRightSnapshot = residenceRightSnapshot; }

    public String getContactSnapshot() { return contactSnapshot; }
    public void setContactSnapshot(String contactSnapshot) { this.contactSnapshot = contactSnapshot; }

    public String getRestrictionSnapshot() { return restrictionSnapshot; }
    public void setRestrictionSnapshot(String restrictionSnapshot) { this.restrictionSnapshot = restrictionSnapshot; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}