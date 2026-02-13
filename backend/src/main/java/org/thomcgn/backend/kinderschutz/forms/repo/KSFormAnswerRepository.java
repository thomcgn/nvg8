package org.thomcgn.backend.kinderschutz.forms.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.kinderschutz.forms.model.KSFormAnswer;

import java.util.List;
import java.util.Optional;

public interface KSFormAnswerRepository extends JpaRepository<KSFormAnswer, Long> {

    List<KSFormAnswer> findByInstanceId(Long instanceId);

    Optional<KSFormAnswer> findByInstanceIdAndItemId(Long instanceId, Long itemId);
}