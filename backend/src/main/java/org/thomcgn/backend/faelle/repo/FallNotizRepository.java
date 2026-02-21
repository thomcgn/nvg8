package org.thomcgn.backend.faelle.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.faelle.model.FallNotiz;

import java.util.List;

public interface FallNotizRepository extends JpaRepository<FallNotiz, Long> {

    @Query("""
    select n from FallNotiz n
    join fetch n.createdBy cb
    where n.fall.id = :fallId
    order by n.createdAt asc
  """)
    List<FallNotiz> findAllByFallId(@Param("fallId") Long fallId);
}