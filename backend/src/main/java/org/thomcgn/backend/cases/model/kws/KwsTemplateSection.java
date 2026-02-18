package org.thomcgn.backend.cases.model.kws;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "kws_template_section")
@Data
public class KwsTemplateSection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private KwsTemplate template;

    @Column(nullable = false, length = 40)
    private String sectionKey;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private int sort;

    // getters/setters
}
