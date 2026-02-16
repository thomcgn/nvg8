package org.thomcgn.backend.cases.repo.kws;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.cases.model.kws.KwsAnswer;

import java.util.List;
import java.util.Optional;

public interface KwsAnswerRepo extends JpaRepository<KwsAnswer, Long> {
    List<KwsAnswer> findByRunId(Long runId);

    Optional<KwsAnswer> findByRunIdAndItemId(Long runId, Long itemId);
}
