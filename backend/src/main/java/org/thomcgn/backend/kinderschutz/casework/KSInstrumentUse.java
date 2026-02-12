package org.thomcgn.backend.kinderschutz.casework;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.cases.model.GefaehrdungsEinschaetzung;
import org.thomcgn.backend.kinderschutz.catalog.KSInstrument;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ks_instrument_use")
@Data
public class KSInstrumentUse {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "einschaetzung_id")
    private GefaehrdungsEinschaetzung einschaetzung;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "instrument_id")
    private KSInstrument instrument;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fachkraft_user_id")
    private User fachkraft; // aus Kopfbereich

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "instrumentUse", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<KSItemAnswer> answers = new ArrayList<>();
}
