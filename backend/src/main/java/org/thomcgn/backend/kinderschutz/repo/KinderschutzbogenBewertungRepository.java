package org.thomcgn.backend.kinderschutz.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.kinderschutz.model.KinderschutzbogenBewertung;

import java.util.List;

public interface KinderschutzbogenBewertungRepository extends JpaRepository<KinderschutzbogenBewertung, Long> {

    List<KinderschutzbogenBewertung> findByAssessment_Id(Long assessmentId);

    @Modifying
    @Query("delete from KinderschutzbogenBewertung b where b.assessment.id = :assessmentId")
    void deleteByAssessmentId(@Param("assessmentId") Long assessmentId);
}
