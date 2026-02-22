package org.thomcgn.backend.shares.repo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.shares.model.CaseShareRequest;
import org.thomcgn.backend.shares.model.ShareRequestStatus;

import java.time.Instant;
import java.util.Optional;

public interface CaseShareRequestRepository extends JpaRepository<CaseShareRequest, Long> {

    @Query("""
      select r from CaseShareRequest r
      join fetch r.partner p
      join fetch r.falleroeffnung f
      join fetch f.traeger t
      join fetch f.einrichtungOrgUnit e
      where r.id = :id
    """)
    Optional<CaseShareRequest> findByIdWithRefs(@Param("id") Long id);

    @Query("""
      select r from CaseShareRequest r
      where r.owningTraeger.id = :traegerId
        and r.owningEinrichtung.id = :einrichtungId
        and r.status = :status
      order by r.createdAt desc
    """)
    Page<CaseShareRequest> findAllOpenByOwningScope(@Param("traegerId") Long traegerId,
                                                    @Param("einrichtungId") Long einrichtungId,
                                                    @Param("status") ShareRequestStatus status,
                                                    Pageable pageable);

    @Query("""
      select r from CaseShareRequest r
      where r.requestedBy.id = :userId
      order by r.createdAt desc
    """)
    Page<CaseShareRequest> findAllByRequestedBy(@Param("userId") Long userId, Pageable pageable);

    /**
     * Markiert "alte" Requests als EXPIRED.
     * Wir nehmen an: Requests sind "alt", wenn sie noch OPEN sind und createdAt < cutoff.
     *
     * @return Anzahl geänderter Zeilen
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
      update CaseShareRequest r
         set r.status = org.thomcgn.backend.shares.model.ShareRequestStatus.EXPIRED
       where r.status = org.thomcgn.backend.shares.model.ShareRequestStatus.OPEN
         and r.createdAt < :cutoff
    """)
    int expireOld(@Param("cutoff") Instant cutoff);
}