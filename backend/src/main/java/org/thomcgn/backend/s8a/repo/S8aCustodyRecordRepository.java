package org.thomcgn.backend.s8a.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.s8a.model.S8aCustodyRecord;

import java.util.List;
import java.util.Optional;

public interface S8aCustodyRecordRepository extends JpaRepository<S8aCustodyRecord, Long> {
    List<S8aCustodyRecord> findAllByS8aCaseIdOrderByCreatedAtAsc(Long s8aCaseId);
    List<S8aCustodyRecord> findAllByS8aCaseIdAndChildPersonIdOrderByCreatedAtAsc(Long s8aCaseId, Long childPersonId);
    Optional<S8aCustodyRecord> findTopByS8aCaseIdAndChildPersonIdAndRightHolderPersonIdOrderByCreatedAtDesc(
            Long s8aCaseId, Long childPersonId, Long rightHolderPersonId
    );
    List<S8aCustodyRecord> findAllByS8aCaseIdAndChildPersonIdAndRightHolderPersonIdOrderByCreatedAtDesc(
            Long s8aCaseId, Long childPersonId, Long rightHolderPersonId
    );
    java.util.Optional<S8aCustodyRecord> findByIdAndS8aCaseId(Long id, Long s8aCaseId);

    List<S8aCustodyRecord> findAllByS8aCaseIdAndSupersedesIdOrderByCreatedAtAsc(Long s8aCaseId, Long supersedesId);
}