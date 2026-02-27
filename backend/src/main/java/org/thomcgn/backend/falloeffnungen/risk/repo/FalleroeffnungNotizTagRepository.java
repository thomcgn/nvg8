package org.thomcgn.backend.falloeffnungen.risk.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.risk.model.FalleroeffnungNotizTag;

import java.util.List;

public interface FalleroeffnungNotizTagRepository extends JpaRepository<FalleroeffnungNotizTag, Long> {

    @Query("""
           select t
           from FalleroeffnungNotizTag t
           where t.notiz.falleroeffnung.id = :fallId
           order by t.createdAt asc
           """)
    List<FalleroeffnungNotizTag> findAllTagsByFallId(Long fallId);

    @Query("""
           select t
           from FalleroeffnungNotizTag t
           where t.notiz.id = :notizId
           order by t.createdAt asc
           """)
    List<FalleroeffnungNotizTag> findAllByNotizId(Long notizId);
}