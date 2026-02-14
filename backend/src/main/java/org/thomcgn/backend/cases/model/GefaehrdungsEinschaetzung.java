package org.thomcgn.backend.cases.model;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.cases.model.enums.EinschaetzungsErgebnis;

import java.time.LocalDate;

@Entity
@Table(name = "gefaehrdung_einschaetzungen")
@Data
public class GefaehrdungsEinschaetzung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "fall_id")
    private KinderschutzFall fall;

    private LocalDate datum;

    @Enumerated(EnumType.STRING)
    private EinschaetzungsErgebnis ergebnis; // KEINE, LATENT, AKUT, ...

    private Boolean kindBeteiligt;
    private Boolean elternBeteiligt;
    private String begruendungKeineBeteiligung; // falls false

    private Boolean iefkEinbezogen;
    private String iefkPerson; // oder Relation zu User/Fachkraft
    private String iefkErgebnisKurz;

    @Lob
    private String begruendung; // fachliche Begründung
}
