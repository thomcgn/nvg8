package org.thomcgn.backend.audit.repo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.audit.model.AuditEvent;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {

    @Query("""
    select a from AuditEvent a
    join fetch a.user u
    where a.traeger.id = :traegerId
      and (:entityType is null or a.entityType = :entityType)
      and (:entityId is null or a.entityId = :entityId)
    order by a.createdAt desc
  """)
    Page<AuditEvent> search(@Param("traegerId") Long traegerId,
                            @Param("entityType") String entityType,
                            @Param("entityId") Long entityId,
                            Pageable pageable);
}