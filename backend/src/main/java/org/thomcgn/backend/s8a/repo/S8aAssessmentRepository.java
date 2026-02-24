package org.thomcgn.backend.s8a.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.s8a.model.S8aAssessment;

import java.util.List;
import java.util.Optional;

public interface S8aAssessmentRepository extends JpaRepository<S8aAssessment, Long> {

    Optional<S8aAssessment> findTopByS8aCaseIdOrderByVersionDesc(Long s8aCaseId);

    Optional<S8aAssessment> findByS8aCaseIdAndVersion(Long s8aCaseId, int version);

    List<S8aAssessment> findAllByS8aCaseIdOrderByVersionDesc(Long s8aCaseId);

    @Query("select coalesce(max(a.version), 0) from S8aAssessment a where a.s8aCase.id = :caseId")
    int findMaxVersion(@Param("caseId") Long caseId);
}