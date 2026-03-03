package org.thomcgn.backend.dossiers.repo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.dossiers.model.KindDossier;

import java.util.Optional;

public interface KindDossierRepository extends JpaRepository<KindDossier, Long> {

    // ✅ EINRICHTUNGS-scope
    Optional<KindDossier> findByIdAndEinrichtungOrgUnit_Id(Long id, Long einrichtungOrgUnitId);

    Optional<KindDossier> findByEinrichtungOrgUnit_IdAndKind_Id(Long einrichtungOrgUnitId, Long kindId);

    @Query("""
    select
        d.id as id,
        k.id as kindId,
        k.vorname as vorname,
        k.nachname as nachname,
        d.createdAt as createdAt,
        max(f.openedAt) as lastFallAt,
        count(f.id) as fallCount
    from KindDossier d
    join d.kind k
    left join Falleroeffnung f on f.dossier = d
    where d.einrichtungOrgUnit.id = :einrichtungOrgUnitId
      and d.enabled = true
      and (
          :q is null
          or lower(concat(coalesce(k.vorname, ''), ' ', coalesce(k.nachname, '')))
             like concat('%', lower(cast(:q as string)), '%')
      )
    group by d.id, k.id, k.vorname, k.nachname, d.createdAt
    order by d.createdAt desc, d.id desc
""")
    Page<AkteListItemProjection> listAkten(
            @Param("einrichtungOrgUnitId") Long einrichtungOrgUnitId,
            @Param("q") String q,
            Pageable pageable
    );

    @Query("""
        select d from KindDossier d
        join fetch d.kind k
        where d.id = :id
          and d.einrichtungOrgUnit.id = :einrichtungOrgUnitId
    """)
    Optional<KindDossier> findByIdScopedWithKind(
            @Param("id") Long id,
            @Param("einrichtungOrgUnitId") Long einrichtungOrgUnitId
    );
}