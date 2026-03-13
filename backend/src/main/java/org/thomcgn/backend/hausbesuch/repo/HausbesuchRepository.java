package org.thomcgn.backend.hausbesuch.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.hausbesuch.model.Hausbesuch;

import java.util.List;
import java.util.Optional;

public interface HausbesuchRepository extends JpaRepository<Hausbesuch, Long> {

    @Query("""
        select h from Hausbesuch h
          join fetch h.createdBy cb
         where h.falloeffnung.id = :falloeffnungId
           and h.traeger.id = :traegerId
           and h.einrichtungOrgUnit.id = :einrichtungId
         order by h.besuchsdatum desc, h.createdAt desc
    """)
    List<Hausbesuch> findByFalloeffnungScoped(
            @Param("falloeffnungId") Long falloeffnungId,
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId
    );

    @Query("""
        select h from Hausbesuch h
          join fetch h.createdBy cb
         where h.id = :id
           and h.traeger.id = :traegerId
           and h.einrichtungOrgUnit.id = :einrichtungId
    """)
    Optional<Hausbesuch> findByIdScoped(
            @Param("id") Long id,
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId
    );
}
