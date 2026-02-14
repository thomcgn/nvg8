package org.thomcgn.backend.cases.model;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.cases.model.enums.Beziehungstyp;
import org.thomcgn.backend.cases.model.enums.Datenquelle;
import org.thomcgn.backend.cases.model.enums.RolleImAlltag;
import org.thomcgn.backend.cases.model.enums.SorgeStatus;

import java.time.LocalDate;

@Entity
@Table(name = "kind_bezugsperson_relation")
@Data
public class KindBezugspersonRelation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "kind_id")
    private Kind kind;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "bezugsperson_id")
    private Bezugsperson bezugsperson;

    @Enumerated(EnumType.STRING)
    private Beziehungstyp beziehungstyp; // MUTTER, VATER, PFLEGEMUTTER, ...

    @Enumerated(EnumType.STRING)
    private RolleImAlltag rolleImAlltag; // ELTERNTEIL, PFLEGE, BETREUUNG, ...

    private Boolean lebtImHaushalt; // ja/nein/unknown -> ggf. Boolean + null
    private LocalDate gueltigVon;
    private LocalDate gueltigBis;

    @Enumerated(EnumType.STRING)
    private SorgeStatus sorgeStatus; // KEIN, TEIL, VOLL, UNBEKANNT
    private String sorgeHinweis;      // Freitext + Quelle/Datum ggf.

    // Provenienz / Datenschutz light (optional, aber sehr hilfreich)
    @Enumerated(EnumType.STRING)
    private Datenquelle datenquelle;
    private LocalDate erhobenAm;
}
