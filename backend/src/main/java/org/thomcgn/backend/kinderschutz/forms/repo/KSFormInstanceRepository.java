package org.thomcgn.backend.kinderschutz.forms.repo;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.kinderschutz.forms.model.KSFormInstance;

import java.util.Optional;

public interface KSFormInstanceRepository extends JpaRepository<KSFormInstance, Long> {

    @EntityGraph(attributePaths = {"answers", "answers.item", "instrument"})
    Optional<KSFormInstance> findWithAnswersById(Long id);

    Optional<KSFormInstance> findByFallIdAndInstrumentId(Long fallId, Long instrumentId);
}