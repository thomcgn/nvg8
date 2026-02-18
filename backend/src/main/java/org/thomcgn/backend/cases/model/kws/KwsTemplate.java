package org.thomcgn.backend.cases.model.kws;

import jakarta.persistence.*;
import lombok.Data;


import java.time.OffsetDateTime;

@Entity
@Table(name = "kws_template")
@Data
public class KwsTemplate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String version = "1";

    private Integer minAgeMonths;
    private Integer maxAgeMonths;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KwsAudience audience = KwsAudience.ALL;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

}

