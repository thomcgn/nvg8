package org.thomcgn.backend.anlass.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "anlass_catalog")
@Getter @Setter @NoArgsConstructor
public class AnlasskatalogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String code;

    @Column(nullable = false, length = 300)
    private String label;

    @Column(length = 150)
    private String category;

    @Column(name = "default_severity")
    private Short defaultSeverity;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
