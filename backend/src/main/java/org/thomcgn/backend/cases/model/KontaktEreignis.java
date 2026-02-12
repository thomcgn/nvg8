package org.thomcgn.backend.cases.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "kontakt_ereignisse")
@Data
public class KontaktEreignis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "fall_id")
    private KinderschutzFall fall;

    private LocalDateTime zeitpunkt;

    @Enumerated(EnumType.STRING)
    private KontaktArt art; // GESPRAECH, HAUSBESUCH, TELEFON, ...

    private String beteiligteKurz; // z.B. "Mutter, Kind, Schule"

    @Lob
    private String notiz;
}
