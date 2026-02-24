package org.thomcgn.backend.s8a.dto;

/**
 * Beteiligter innerhalb einer Assessment-Version.
 *
 * casePersonId: eindeutige Person im S8aCase-Kontext
 * childCasePersonId (optional): falls Snapshots aus Kind<->Bezugsperson Records gezogen werden sollen
 *
 * Snapshot-Felder:
 * - Wenn im Request gesetzt -> werden 1:1 gespeichert (Override).
 * - Wenn leer/null -> werden automatisch aus Records generiert (Auto-Snapshot).
 */
public record S8aAssessmentParticipantDto(
        Long casePersonId,
        Long childCasePersonId,            // optional
        String roleInAssessment,

        String custodySnapshot,
        String residenceRightSnapshot,
        String contactSnapshot,
        String restrictionSnapshot,
        String notes
) {}