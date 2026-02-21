package org.thomcgn.backend.s8a.repo;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.s8a.model.S8aCase;

import java.util.List;
import java.util.Optional;

public interface S8aCaseRepository extends JpaRepository<S8aCase, Long> {

    @Query("""
    select c from S8aCase c
    join fetch c.fall f
    join fetch c.traeger t
    join fetch c.einrichtung e
    join fetch c.createdBy cb
    where c.id = :id
  """)
    Optional<S8aCase> findByIdWithRefs(@Param("id") Long id);

    List<S8aCase> findAllByFallIdOrderByCreatedAtDesc(Long fallId);
}