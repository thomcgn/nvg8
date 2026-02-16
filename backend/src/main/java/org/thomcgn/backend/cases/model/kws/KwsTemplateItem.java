package org.thomcgn.backend.cases.model.kws;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "kws_template_item")
@Data
public class KwsTemplateItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private KwsTemplateSection section;

    @Column(nullable = false, length = 40)
    private String itemKey;

    @Column(nullable = false, columnDefinition = "text")
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private KwsAnswerType answerType;

    @Column(nullable = false)
    private int sort;
}
