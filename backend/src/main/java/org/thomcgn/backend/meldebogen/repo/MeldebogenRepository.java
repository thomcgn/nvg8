package org.thomcgn.backend.meldebogen.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.meldebogen.model.Meldebogen;

import java.util.List;
import java.util.Optional;

public interface MeldebogenRepository extends JpaRepository<Meldebogen, Long> {

    @Query("""
        select m from Meldebogen m
          join fetch m.createdBy cb
         where m.falloeffnung.id = :falloeffnungId
           and m.traeger.id = :traegerId
           and m.einrichtungOrgUnit.id = :einrichtungId
         order by m.eingangsdatum desc, m.createdAt desc
    """)
    List<Meldebogen> findByFalloeffnungScoped(
            @Param("falloeffnungId") Long falloeffnungId,
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId
    );

    @Query("""
        select m from Meldebogen m
          join fetch m.createdBy cb
         where m.id = :id
           and m.traeger.id = :traegerId
           and m.einrichtungOrgUnit.id = :einrichtungId
    """)
    Optional<Meldebogen> findByIdScoped(
            @Param("id") Long id,
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId
    );
}
