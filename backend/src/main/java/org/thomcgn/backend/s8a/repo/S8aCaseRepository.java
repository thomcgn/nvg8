package org.thomcgn.backend.s8a.repo;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.s8a.model.S8aCase;

import java.util.List;
import java.util.Optional;

public interface S8aCaseRepository extends JpaRepository<S8aCase, Long> {

    /**
     * UNSCOPED: Nur für interne Admin/Debug Zwecke nutzen.
     * Wenn ihr das nicht braucht: löschen, um Leaks zu verhindern.
     */

    @Query("""
      select c from S8aCase c
      join fetch c.falleroeffnung f
      join fetch f.dossier d
      join fetch d.kind k
      join fetch c.traeger t
      join fetch c.einrichtung ein
      join fetch c.createdBy cb
      where c.id = :id
        and c.traeger.id = :traegerId
        and c.einrichtung.id = :einrichtungId
    """)
    Optional<S8aCase> findByIdWithRefsScoped(
            @Param("id") Long id,
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId
    );

    @Query("""
      select c from S8aCase c
      join c.falleroeffnung f
      where f.id = :falleroeffnungId
        and f.traeger.id = :traegerId
        and f.einrichtungOrgUnit.id = :einrichtungId
      order by c.createdAt desc
    """)
    List<S8aCase> findAllByFalleroeffnungIdScopedOrderByCreatedAtDesc(
            @Param("falleroeffnungId") Long falleroeffnungId,
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId
    );
}