package org.thomcgn.backend.falloeffnungen.repo;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.model.FalleroeffnungStatus;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FalleroeffnungRepository extends JpaRepository<Falleroeffnung, Long> {

    // -----------------------------------------------------
    // Unscoped with refs (z.B. Shares)
    // -----------------------------------------------------
    @Query("""
        select f
          from Falleroeffnung f
          left join fetch f.traeger t
          left join fetch f.einrichtungOrgUnit e
          left join fetch f.dossier d
          left join fetch d.kind k
         where f.id = :fallId
    """)
    Optional<Falleroeffnung> findByIdWithRefs(@Param("fallId") Long fallId);

    // -----------------------------------------------------
    // Scoped with refs (Traeger + Einrichtung)
    // -----------------------------------------------------
    @Query("""
        select f
          from Falleroeffnung f
          left join fetch f.traeger t
          left join fetch f.einrichtungOrgUnit e
          left join fetch f.teamOrgUnit team
          left join fetch f.dossier d
          left join fetch d.kind k
          left join fetch f.createdBy cb
         where f.id = :fallId
           and t.id = :traegerId
           and e.id = :einrichtungId
    """)
    Optional<Falleroeffnung> findByIdWithRefsScoped(
            @Param("fallId") Long fallId,
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId
    );

    // -----------------------------------------------------
    // Akte: Fälle eines Dossiers scoped auf Träger + erlaubte Einrichtungen
    // -----------------------------------------------------
    @Query("""
        select f
          from Falleroeffnung f
          join fetch f.einrichtungOrgUnit e
          join fetch f.traeger t
          join fetch f.dossier d
          join fetch d.kind k
          left join fetch f.teamOrgUnit team
          left join fetch f.createdBy cb
         where t.id = :traegerId
           and d.id = :dossierId
           and e.id in :allowedEinrichtungen
         order by f.createdAt desc
    """)
    List<Falleroeffnung> listByDossierScoped(
            @Param("traegerId") Long traegerId,
            @Param("dossierId") Long dossierId,
            @Param("allowedEinrichtungen") Set<Long> allowedEinrichtungen
    );

    // -----------------------------------------------------
    // Fall-Liste: scoped Suche (Status optional, q optional) + Paging
    // -----------------------------------------------------
    @Query(
            value = """
                select f
                  from Falleroeffnung f
                  join fetch f.einrichtungOrgUnit e
                  join fetch f.traeger t
                  join fetch f.dossier d
                  join fetch d.kind k
                  left join fetch f.teamOrgUnit team
                  left join fetch f.createdBy cb
                 where t.id = :traegerId
                   and e.id in :allowedEinrichtungen
                   and (:status is null or f.status = :status)
                   and (
                        :q is null
                        or :q = ''
                        or lower(f.aktenzeichen) like lower(concat('%', :q, '%'))
                        or lower(f.titel)       like lower(concat('%', :q, '%'))
                        or lower(k.vorname)     like lower(concat('%', :q, '%'))
                        or lower(k.nachname)    like lower(concat('%', :q, '%'))
                   )
            """,
            countQuery = """
                select count(f)
                  from Falleroeffnung f
                  join f.einrichtungOrgUnit e
                  join f.traeger t
                  join f.dossier d
                  join d.kind k
                 where t.id = :traegerId
                   and e.id in :allowedEinrichtungen
                   and (:status is null or f.status = :status)
                   and (
                        :q is null
                        or :q = ''
                        or lower(f.aktenzeichen) like lower(concat('%', :q, '%'))
                        or lower(f.titel)       like lower(concat('%', :q, '%'))
                        or lower(k.vorname)     like lower(concat('%', :q, '%'))
                        or lower(k.nachname)    like lower(concat('%', :q, '%'))
                   )
            """
    )
    Page<Falleroeffnung> searchScoped(
            @Param("traegerId") Long traegerId,
            @Param("allowedEinrichtungen") Set<Long> allowedEinrichtungen,
            @Param("status") FalleroeffnungStatus status,
            @Param("q") String q,
            Pageable pageable
    );

    // -----------------------------------------------------
    // KindDossierService.listFaelle(): paging by dossier
    // -----------------------------------------------------
    Page<Falleroeffnung> findByDossier_IdOrderByOpenedAtDesc(Long dossierId, Pageable pageable);

    // -----------------------------------------------------
    // Latest cases by Kind in scope (Traeger + Einrichtung)
    // (matches your compile error signature exactly)
    // -----------------------------------------------------
    @Query(
            value = """
                select f
                  from Falleroeffnung f
                  join fetch f.einrichtungOrgUnit e
                  join fetch f.traeger t
                  join fetch f.dossier d
                  join fetch d.kind k
                  left join fetch f.teamOrgUnit team
                 where t.id = :traegerId
                   and e.id = :einrichtungId
                   and k.id = :kindId
                 order by f.openedAt desc nulls last, f.createdAt desc
            """,
            countQuery = """
                select count(f)
                  from Falleroeffnung f
                  join f.einrichtungOrgUnit e
                  join f.traeger t
                  join f.dossier d
                  join d.kind k
                 where t.id = :traegerId
                   and e.id = :einrichtungId
                   and k.id = :kindId
            """
    )
    Page<Falleroeffnung> findLatestByKindIdScoped(
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId,
            @Param("kindId") Long kindId,
            PageRequest pageable
    );

    // -----------------------------------------------------
    // Row lock (für Meldung create/versioning Lösung A)
    // -----------------------------------------------------
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from Falleroeffnung f where f.id = :id")
    Optional<Falleroeffnung> lockById(@Param("id") Long id);
}