package org.thomcgn.backend.cases.model.kws;

import jakarta.persistence.*;
import lombok.Data;

import java.time.OffsetDateTime;

@Entity
@Table(name = "kws_run_event")
@Data
public class KwsRunEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "run_id")
    private KwsRun run;

    @Column(nullable = false, length = 20)
    private String type; // CREATED/SAVED/FINALIZED

    @Column(columnDefinition = "jsonb")
    private String payload; // String mit JSON; simpel (oder JsonNode)

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
