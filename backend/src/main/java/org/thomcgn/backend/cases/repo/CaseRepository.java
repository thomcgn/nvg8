package org.thomcgn.backend.cases.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.cases.model.CaseFile;

import java.util.List;
import java.util.Optional;

public interface CaseRepository extends JpaRepository<CaseFile,Long> {
    Optional<CaseFile> findByIdAndCreatedBy(Long id, User createdBy);

    List<CaseFile> findByCreatedByAndDraftTrue(User user);
}
