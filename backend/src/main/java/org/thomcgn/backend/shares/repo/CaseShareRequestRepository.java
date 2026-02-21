package org.thomcgn.backend.shares.repo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.shares.model.CaseShareRequest;
import org.thomcgn.backend.shares.model.ShareRequestStatus;

import java.util.List;
import java.util.Optional;

public interface CaseShareRequestRepository extends JpaRepository<CaseShareRequest, Long> {

    @Query("""
    select r from CaseShareRequest r
    join fetch r.partner p
    join fetch r.fall f
    where r.id = :id
  """)
    Optional<CaseShareRequest> findByIdWithRefs(@Param("id") Long id);

    List<CaseShareRequest> findByFallIdAndStatus(Long fallId, ShareRequestStatus status);

    @Query("""
    select r from CaseShareRequest r
    join fetch r.partner p
    join fetch r.requestedBy rb
    where r.id = :id
  """)
    Optional<CaseShareRequest> findByIdWithDetailRefs(@Param("id") Long id);

    @Query("""
    select r from CaseShareRequest r
    join fetch r.partner p
    where r.owningTraeger.id = :traegerId
      and r.owningEinrichtung.id = :einrichtungId
      and (:status is null or r.status = :status)
    order by r.createdAt desc
  """)
    Page<CaseShareRequest> inboxForEinrichtung(@Param("traegerId") Long traegerId,
                                               @Param("einrichtungId") Long einrichtungId,
                                               @Param("status") ShareRequestStatus status,
                                               Pageable pageable);

    // Optional: Trägerweite Inbox (nur TRAEGER_ADMIN)
    @Query("""
    select r from CaseShareRequest r
    join fetch r.partner p
    where r.owningTraeger.id = :traegerId
      and (:status is null or r.status = :status)
    order by r.createdAt desc
  """)
    Page<CaseShareRequest> inboxTraegerWide(@Param("traegerId") Long traegerId,
                                            @Param("status") ShareRequestStatus status,
                                            Pageable pageable);
}