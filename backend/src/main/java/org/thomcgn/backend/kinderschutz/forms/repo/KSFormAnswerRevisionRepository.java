package org.thomcgn.backend.kinderschutz.forms.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.kinderschutz.forms.model.KSFormAnswerRevision;

import java.util.List;

public interface KSFormAnswerRevisionRepository extends JpaRepository<KSFormAnswerRevision, Long> {

    List<KSFormAnswerRevision> findByInstanceIdAndInstanceVersionOrderByIdAsc(Long instanceId, Long instanceVersion);
}