package org.thomcgn.backend.kinderschutz.catalog;

import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ks_instrumente")
@Data
public class KSInstrument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private String code;   // z.B. "DL-0-12M-01" oder "AH-2-xx"
    @Column(nullable = false) private String titel;  // "Checkliste 0 bis <12 Monate – Säugling"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InstrumentTyp typ; // DOKUBOGEN, CHECKLISTE, ...

    private String version;     // "2024-01"
    private boolean aktiv = true;

    @Embedded
    private ApplicabilityRule applicability; // min/max AgeMonths etc.

    @OneToMany(mappedBy = "instrument", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<KSSection> sections = new ArrayList<>();
}
