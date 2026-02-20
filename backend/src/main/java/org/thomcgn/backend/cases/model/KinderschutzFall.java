package org.thomcgn.backend.cases.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.thomcgn.backend.auth.model.User;
import org.thomcgn.backend.cases.model.enums.EinschaetzungsErgebnis;
import org.thomcgn.backend.cases.model.enums.FallStatus;
import org.thomcgn.backend.cases.model.enums.Gefaehrdungsbereich;

import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "kinderschutz_faelle")
@Data
public class KinderschutzFall extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @Column(unique = true)
    private String aktenzeichen;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "kind_id")
    private Kind kind;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zustaendige_fachkraft_id")
    private User zustaendigeFachkraft;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teamleitung_id")
    private User teamleitung;

    @Enumerated(EnumType.STRING)
    private FallStatus status;

    @ElementCollection(targetClass = Gefaehrdungsbereich.class)
    @CollectionTable(name = "fall_gefaehrdungsbereiche",
            joinColumns = @JoinColumn(name = "fall_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "bereich")
    private List<Gefaehrdungsbereich> gefaehrdungsbereiche = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private EinschaetzungsErgebnis letzteEinschaetzung;

    private Boolean iefkPflichtig;
    private Boolean gerichtEingeschaltet;
    private Boolean inobhutnahmeErfolgt;

    private String kurzbeschreibung;

    @OneToMany(mappedBy = "fall", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MeldungHinweis> meldungen = new ArrayList<>();

    @OneToMany(mappedBy = "fall", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GefaehrdungsEinschaetzung> einschaetzungen = new ArrayList<>();

    @OneToMany(mappedBy = "fall", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<KontaktEreignis> kontakte = new ArrayList<>();

    @OneToMany(mappedBy = "fall", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Massnahme> massnahmen = new ArrayList<>();
}