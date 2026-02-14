package org.thomcgn.backend.kinderschutz.casework;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.cases.model.enums.Datenquelle;
import org.thomcgn.backend.kinderschutz.catalog.KSItem;

import java.time.LocalDate;

@Entity
@Table(name = "ks_item_answers")
@Data
public class KSItemAnswer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "instrument_use_id")
    private KSInstrumentUse instrumentUse;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private KSItem item;

    // für TRI_STATE
    @Enumerated(EnumType.STRING)
    private TriState triState; // JA/NEIN/UNBEKANNT (= keine Angaben möglich)

    // für TEXT / allgemeine Notizen
    @Lob
    private String textValue;

    // Metadaten wie im Bogen üblich
    @Lob
    private String kommentar; // Beobachtungen / Ergänzungen

    @Enumerated(EnumType.STRING)
    private Datenquelle datenquelle;

    private LocalDate erhobenAm;
}
