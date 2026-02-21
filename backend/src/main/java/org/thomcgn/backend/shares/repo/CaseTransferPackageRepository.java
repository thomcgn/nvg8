package org.thomcgn.backend.shares.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.shares.model.CaseTransferPackage;

import java.util.Optional;

public interface CaseTransferPackageRepository extends JpaRepository<CaseTransferPackage, Long> {

    @Query("""
    select p from CaseTransferPackage p
    join fetch p.shareRequest r
    join fetch r.partner partner
    join fetch r.fall f
    where p.tokenHashHex = :hash
  """)
    Optional<CaseTransferPackage> findByTokenHash(@Param("hash") String tokenHashHex);
}