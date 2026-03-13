package org.thomcgn.backend.dji.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.dji.model.DjiPosition;

import java.util.List;

public interface DjiPositionRepository extends JpaRepository<DjiPosition, Long> {

    List<DjiPosition> findByAssessment_Id(Long assessmentId);

    @Modifying
    @Query("delete from DjiPosition p where p.assessment.id = :assessmentId")
    void deleteByAssessmentId(@Param("assessmentId") Long assessmentId);
}
