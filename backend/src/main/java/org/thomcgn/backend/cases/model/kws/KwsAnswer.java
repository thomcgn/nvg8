package org.thomcgn.backend.cases.model.kws;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "kws_answer")
@Data
public class KwsAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "run_id")
    private KwsRun run;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private KwsTemplateItem item;

    @Enumerated(EnumType.STRING)
    private KwsTriState triState;

    @Column(columnDefinition = "text")
    private String textValue;

    private LocalDate dateValue;

    @Column(columnDefinition = "text")
    private String comment;

    @Column(nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    // getters/setters
}
