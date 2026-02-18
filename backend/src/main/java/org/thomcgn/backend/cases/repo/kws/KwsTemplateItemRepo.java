package org.thomcgn.backend.cases.repo.kws;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.cases.model.kws.KwsTemplateItem;

import java.util.List;

public interface KwsTemplateItemRepo extends JpaRepository<KwsTemplateItem, Long> {
    List<KwsTemplateItem> findBySectionIdOrderBySortAsc(Long sectionId);
}
