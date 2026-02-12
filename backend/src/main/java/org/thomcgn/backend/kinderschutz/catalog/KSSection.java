package org.thomcgn.backend.kinderschutz.catalog;

import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ks_sections")
@Data
public class KSSection {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "instrument_id")
    private KSInstrument instrument;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private KSSection parent;

    @Column(nullable = false)
    private String sectionNo;  // "1.0", "1.1", "2.1", "2.2" ...

    @Column(nullable = false)
    private String title;      // "Kontext...", "Äußeres Erscheinungsbild..." etc.

    @Lob
    private String hintText;   // z.B. "(Bitte zutreffende Beschreibungen...)"

    private Integer orderIndex = 0;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<KSItem> items = new ArrayList<>();
}
