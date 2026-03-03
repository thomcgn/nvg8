// src/main/java/org/thomcgn/backend/falloeffnungen/meldung/repo/MeldungRepository.java
package org.thomcgn.backend.falloeffnungen.meldung.repo;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.falloeffnungen.meldung.model.Meldung;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MeldungRepository extends JpaRepository<Meldung, Long> {

    // =========================================================
    // CURRENT
    // =========================================================

    @Query("select m from Meldung m where m.falleroeffnung.id = :fallId and m.current = true")
    Optional<Meldung> findCurrentByFallId(@Param("fallId") Long fallId);

    /**
     * Pessimistic lock on the current Meldung row (if any) to avoid races.
     * Used in create/versioning.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from Meldung m where m.falleroeffnung.id = :fallId and m.current = true")
    Optional<Meldung> findCurrentByFallIdForUpdate(@Param("fallId") Long fallId);

    /**
     * Bulk fetch current Meldungen for multiple Fall IDs (used for dashboards/lists).
     */
    @Query("""
        select m
          from Meldung m
         where m.current = true
           and m.falleroeffnung.id in :fallIds
    """)
    List<Meldung> findCurrentByFallIds(@Param("fallIds") Collection<Long> fallIds);

    // =========================================================
    // VERSIONING HELPERS
    // =========================================================

    // OK for display/debug, but do NOT use for race-safe versioning unless you lock elsewhere.
    @Query("select max(m.versionNo) from Meldung m where m.falleroeffnung.id = :fallId")
    Integer findMaxVersionNo(@Param("fallId") Long fallId);

    /**
     * Convenience alias used in your MeldungService.
     * Because you already lock on Falleroeffnung + current row in createNew(),
     * this is safe enough for "nextVersion".
     */
    @Query("select coalesce(max(m.versionNo), 0) from Meldung m where m.falleroeffnung.id = :fallId")
    Integer getMaxVersionNo(@Param("fallId") Long fallId);

    Optional<Meldung> findTopByFalleroeffnung_IdOrderByVersionNoDesc(Long fallId);

    @Query("select m from Meldung m where m.falleroeffnung.id = :fallId order by m.versionNo desc")
    List<Meldung> listByFall(@Param("fallId") Long fallId);

    @Modifying(flushAutomatically = true, clearAutomatically = false)
    @Query("""
        update Meldung m
           set m.current = false
         where m.falleroeffnung.id = :fallId
           and m.id <> :keepId
           and m.current = true
    """)
    int clearCurrentByFallIdExcept(@Param("fallId") Long fallId, @Param("keepId") Long keepId);

    /**
     * If you want a single-call "race-safe next version" with a pessimistic lock:
     * (Mostly used in startCorrection()).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select coalesce(max(m.versionNo), 0) from Meldung m where m.falleroeffnung.id = :fallId")
    Integer lockAndGetMaxVersionNo(@Param("fallId") Long fallId);
}