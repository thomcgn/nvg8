package org.thomcgn.backend.s8a.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.s8a.model.S8aAssessmentParticipant;

import java.util.List;

public interface S8aAssessmentParticipantRepository extends JpaRepository<S8aAssessmentParticipant, Long> {
    List<S8aAssessmentParticipant> findAllByAssessmentIdOrderByIdAsc(Long assessmentId);
}