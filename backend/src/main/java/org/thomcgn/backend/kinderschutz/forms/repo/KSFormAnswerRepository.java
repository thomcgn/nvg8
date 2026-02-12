package org.thomcgn.backend.kinderschutz.forms.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.kinderschutz.forms.model.KSFormAnswer;

import java.util.Optional;

public interface KSFormAnswerRepository extends JpaRepository<KSFormAnswer, Long> {
    Optional<KSFormAnswer> findByInstance_IdAndItem_Id(Long instanceId, Long itemId);
}
