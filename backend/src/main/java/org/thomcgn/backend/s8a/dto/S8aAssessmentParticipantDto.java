package org.thomcgn.backend.s8a.dto;

/**
 * Beteiligter innerhalb einer Assessment-Version.
 *
 * Referenziert eine S8aCasePerson (konkret im Vorgang) und friert
 * die juristisch relevanten Punkte als Snapshot ein.
 */
public record S8aAssessmentParticipantDto(
        Long casePersonId,
        String roleInAssessment,
        String custodySnapshot,
        String residenceRightSnapshot,
        String contactSnapshot,
        String restrictionSnapshot,
        String notes
) {}