package org.thomcgn.backend.falloeffnungen.repo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.model.FalleroeffnungStatus;

import java.util.Optional;
import java.util.Set;
import java.util.List;

public interface FalleroeffnungRepository extends JpaRepository<Falleroeffnung, Long> {

    @Deprecated(forRemoval = true)
    @Query("""
      select f from Falleroeffnung f
      join fetch f.dossier d
      join fetch d.kind k
      join fetch f.traeger t
      join fetch f.einrichtungOrgUnit ein
      left join fetch f.teamOrgUnit team
      join fetch f.createdBy cb
      where f.id = :id
    """)
    Optional<Falleroeffnung> findByIdWithRefs(@Param("id") Long id);

    @Query("""
      select f from Falleroeffnung f
      join fetch f.dossier d
      join fetch d.kind k
      join fetch f.traeger t
      join fetch f.einrichtungOrgUnit ein
      left join fetch f.teamOrgUnit team
      join fetch f.createdBy cb
      where f.id = :id
        and f.traeger.id = :traegerId
        and f.einrichtungOrgUnit.id = :einrichtungId
    """)
    Optional<Falleroeffnung> findByIdWithRefsScoped(
            @Param("id") Long id,
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId
    );

    @Query("""
      select f from Falleroeffnung f
      where f.traeger.id = :traegerId
        and f.einrichtungOrgUnit.id in :einrichtungIds
        and (:status is null or f.status = :status)
        and (
             nullif(trim(:q), '') is null
             or lower(f.titel) like lower(concat('%', :q, '%'))
             or lower(f.aktenzeichen) like lower(concat('%', :q, '%'))
        )
      order by f.createdAt desc
    """)
    Page<Falleroeffnung> searchScoped(
            @Param("traegerId") Long traegerId,
            @Param("einrichtungIds") Set<Long> einrichtungIds,
            @Param("status") FalleroeffnungStatus status,
            @Param("q") String q,
            Pageable pageable
    );

    @Query("""
      select f from Falleroeffnung f
      join f.dossier d
      join d.kind k
      where f.traeger.id = :traegerId
        and f.einrichtungOrgUnit.id = :einrichtungId
        and k.id = :kindId
      order by f.createdAt desc
    """)
    Page<Falleroeffnung> findLatestByKindIdScoped(
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId,
            @Param("kindId") Long kindId,
            Pageable pageable
    );

    // ✅ NEW: Fälle pro Akte/Dossier (scoped by allowed einrichtungen)
    @Query("""
      select f from Falleroeffnung f
      where f.traeger.id = :traegerId
        and f.dossier.id = :dossierId
        and f.einrichtungOrgUnit.id in :einrichtungIds
      order by f.createdAt desc
    """)
    List<Falleroeffnung> listByDossierScoped(
            @Param("traegerId") Long traegerId,
            @Param("dossierId") Long dossierId,
            @Param("einrichtungIds") Set<Long> einrichtungIds
    );
}