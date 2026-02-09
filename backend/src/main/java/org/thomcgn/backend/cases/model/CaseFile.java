package org.thomcgn.backend.cases.model;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.cases.model.Kind;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "cases")
public class CaseFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private CaseStatus status = CaseStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime finalizedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kind_id", nullable = false)
    private Kind kind; // statt String

    @Column(columnDefinition = "TEXT")
    private String description;

    private boolean draft = true;

    // Jede neue Beobachtung/Einschätzung = neuer CaseFile-Datensatz
}
