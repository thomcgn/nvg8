package org.thomcgn.backend.falloeffnungen.repo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.model.FalleroeffnungStatus;

import java.util.Optional;
import java.util.Set;

public interface FalleroeffnungRepository extends JpaRepository<Falleroeffnung, Long> {

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
      where f.traeger.id = :traegerId
        and f.einrichtungOrgUnit.id in :einrichtungIds
        and (:status is null or f.status = :status)
        and (:q is null or lower(f.titel) like lower(concat('%', :q, '%')) or lower(f.aktenzeichen) like lower(concat('%', :q, '%')))
      order by f.createdAt desc
    """)
    Page<Falleroeffnung> searchScoped(
            @Param("traegerId") Long traegerId,
            @Param("einrichtungIds") Set<Long> einrichtungIds,
            @Param("status") FalleroeffnungStatus status,
            @Param("q") String q,
            Pageable pageable
    );
}