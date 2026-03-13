package org.thomcgn.backend.schutzplan.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.schutzplan.model.Schutzplan;

import java.util.List;
import java.util.Optional;

public interface SchutzplanRepository extends JpaRepository<Schutzplan, Long> {

    @Query("""
        select s from Schutzplan s
          join fetch s.createdBy cb
         where s.falloeffnung.id = :falloeffnungId
           and s.traeger.id = :traegerId
           and s.einrichtungOrgUnit.id = :einrichtungId
         order by s.erstelltAm desc, s.createdAt desc
    """)
    List<Schutzplan> findByFalloeffnungScoped(
            @Param("falloeffnungId") Long falloeffnungId,
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId
    );

    @Query("""
        select s from Schutzplan s
          join fetch s.createdBy cb
         where s.id = :id
           and s.traeger.id = :traegerId
           and s.einrichtungOrgUnit.id = :einrichtungId
    """)
    Optional<Schutzplan> findByIdScoped(
            @Param("id") Long id,
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId
    );
}
