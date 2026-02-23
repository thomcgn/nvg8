package org.thomcgn.backend.falloeffnungen.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.falloeffnungen.model.FalleroeffnungNotiz;

import java.util.List;

public interface FalleroeffnungNotizRepository extends JpaRepository<FalleroeffnungNotiz, Long> {

    /**
     * UNSCOPED: Nur für interne Admin/Debug Zwecke nutzen.
     * Wenn ihr das nicht braucht: löschen, um Leaks zu verhindern.
     */
    @Deprecated(forRemoval = true)
    List<FalleroeffnungNotiz> findAllByFalleroeffnungIdOrderByCreatedAtAsc(Long falleroeffnungId);

    @Query("""
      select n from FalleroeffnungNotiz n
      join n.falleroeffnung f
      where f.id = :falleroeffnungId
        and f.traeger.id = :traegerId
        and f.einrichtungOrgUnit.id = :einrichtungId
      order by n.createdAt asc
    """)
    List<FalleroeffnungNotiz> findAllByFalleroeffnungIdScopedOrderByCreatedAtAsc(
            @Param("falleroeffnungId") Long falleroeffnungId,
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId
    );
}