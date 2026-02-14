package org.thomcgn.backend.cases.model;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.cases.model.enums.Datenquelle;
import org.thomcgn.backend.cases.model.enums.Unterbringungsart;

import java.time.LocalDate;

@Entity
@Table(name = "unterbringungen")
@Data
public class Unterbringung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "kind_id")
    private Kind kind;

    @Enumerated(EnumType.STRING)
    private Unterbringungsart art; // BEI_ELTERN, PFLEGEFAMILIE, HEIM, KLINIK, ...

    private String einrichtungName; // falls Einrichtung
    private String ort;             // ggf. Adresse als eigene Entität später

    private LocalDate von;
    private LocalDate bis;

    private String grundKurz; // z.B. "Inobhutnahme", "Hilfe zur Erziehung" - ohne Details

    @Enumerated(EnumType.STRING)
    private Datenquelle datenquelle;
    private LocalDate erhobenAm;
}
