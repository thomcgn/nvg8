package org.thomcgn.backend.dji.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.dji.model.DjiAssessment;

import java.util.List;
import java.util.Optional;

public interface DjiAssessmentRepository extends JpaRepository<DjiAssessment, Long> {

    @Query("""
        select a from DjiAssessment a
          join fetch a.falloeffnung f
          join fetch a.traeger t
          join fetch a.einrichtungOrgUnit e
          join fetch a.createdBy cb
         where a.id = :id
           and t.id = :traegerId
           and e.id = :einrichtungId
    """)
    Optional<DjiAssessment> findByIdScoped(
            @Param("id") Long id,
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId
    );

    @Query("""
        select a from DjiAssessment a
          join fetch a.createdBy cb
         where a.falloeffnung.id = :falloeffnungId
           and a.traeger.id = :traegerId
           and a.einrichtungOrgUnit.id = :einrichtungId
         order by a.bewertungsdatum desc, a.createdAt desc
    """)
    List<DjiAssessment> findByFalloeffnungScoped(
            @Param("falloeffnungId") Long falloeffnungId,
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId
    );
}
