package org.thomcgn.backend.kinderschutz.catalog;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "ks_items")
@Data
public class KSItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private KSSection section;

    @Column(nullable = false)
    private String itemNo;     // "2.1.1"

    @Lob
    @Column(nullable = false)
    private String text;       // kompletter Fragetext

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnswerType answerType; // TRI_STATE, TEXT, DATE, PERSON_REF etc.

    private Integer orderIndex = 0;

    // optional fürs Scoring (bei echten Risiko/Schutz-Checklisten)
    private Integer gewicht = 1;
    private boolean akutKriterium = false;
}

