package org.thomcgn.backend.cases.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Table(name = "massnahmen")
@Data
public class Massnahme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "fall_id")
    private KinderschutzFall fall;

    @Enumerated(EnumType.STRING)
    private MassnahmenTyp typ;

    private String titel;

    @Lob
    private String beschreibung;

    private LocalDate faelligAm;

    @Enumerated(EnumType.STRING)
    private MassnahmenStatus status;

    private String verantwortlich; // später: Relation zu User/Fachkraft
}
