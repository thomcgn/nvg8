package org.thomcgn.backend.invites.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.invites.model.Invite;

import java.util.Optional;

public interface InviteRepository extends JpaRepository<Invite, Long> {

    @Query("""
    select i from Invite i
    join fetch i.orgUnit ou
    join fetch ou.traeger t
    where i.tokenHashHex = :hash
  """)
    Optional<Invite> findByTokenHash(@Param("hash") String tokenHashHex);

    Optional<Invite> findByIdAndRevokedFalse(Long id);
}