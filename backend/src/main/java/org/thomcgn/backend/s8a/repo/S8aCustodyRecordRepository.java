package org.thomcgn.backend.s8a.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.s8a.model.S8aCustodyRecord;

import java.util.List;

public interface S8aCustodyRecordRepository extends JpaRepository<S8aCustodyRecord, Long> {
    List<S8aCustodyRecord> findAllByS8aCaseIdOrderByCreatedAtAsc(Long s8aCaseId);
    List<S8aCustodyRecord> findAllByS8aCaseIdAndChildPersonIdOrderByCreatedAtAsc(Long s8aCaseId, Long childPersonId);
}