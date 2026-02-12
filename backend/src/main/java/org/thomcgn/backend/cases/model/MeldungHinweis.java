package org.thomcgn.backend.cases.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Table(name = "meldungen_hinweise")
@Data
public class MeldungHinweis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "fall_id")
    private KinderschutzFall fall;

    private LocalDate eingangAm;

    @Enumerated(EnumType.STRING)
    private Meldungsweg meldungsweg; // TELEFON, EMAIL, PERSOENLICH, SCHRIFTLICH

    private String meldendeStelle;   // z.B. Schule, Nachbar, Polizei
    private String kontaktInfo;      // optional

    @Lob
    private String inhalt;           // “was wurde gemeldet” (Achtung Datenschutz/Rollen!)
}
