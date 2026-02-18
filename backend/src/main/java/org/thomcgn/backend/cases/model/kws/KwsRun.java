package org.thomcgn.backend.cases.model.kws;

import lombok.Data;
import org.thomcgn.backend.cases.model.Kind;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "kws_run")
@Data
public class KwsRun {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private KwsTemplate template;

    // DB-Spalte kind_id exists; wir mappen auf Entity Kind
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "kind_id")
    private Kind kind;

    // created_by_user_id: falls du keinen User-Entity sauber hast: als Long lassen.
    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(nullable = false)
    private LocalDate assessmentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private KwsRunStatus status = KwsRunStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_run_id")
    private KwsRun parentRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_run_id")
    private KwsRun relatedRun;

    @Column(columnDefinition = "text")
    private String reason;

    private LocalDate nextReviewDate;

    @Column(nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    private OffsetDateTime finalizedAt;

    // getters/setters
}

