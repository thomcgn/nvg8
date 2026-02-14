package org.thomcgn.backend.cases.model;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.cases.model.enums.Datenquelle;
import org.thomcgn.backend.cases.model.enums.GesundheitsmerkmalTyp;

import java.time.LocalDate;

@Entity
@Table(name = "gesundheitsmerkmale")
@Data
public class Gesundheitsmerkmal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "kind_id")
    private Kind kind;

    @Enumerated(EnumType.STRING)
    private GesundheitsmerkmalTyp typ;

    // generisch: je nach typ nutzen
    private String wertText;      // z.B. Merkzeichen "G, aG"
    private Integer wertZahl;     // z.B. GdB
    private LocalDate gueltigBis; // z.B. Befristung

    private Boolean vertraulich;  // für Rechte-/Sichtbarkeitslogik (zusätzlich zu RBAC)

    @Enumerated(EnumType.STRING)
    private Datenquelle datenquelle;
    private LocalDate erhobenAm;
}
