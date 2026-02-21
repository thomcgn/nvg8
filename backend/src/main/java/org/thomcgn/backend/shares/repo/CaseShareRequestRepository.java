package org.thomcgn.backend.shares.repo;

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
}