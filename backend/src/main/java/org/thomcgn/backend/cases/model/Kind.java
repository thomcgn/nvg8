package org.thomcgn.backend.cases.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.thomcgn.backend.model.Person;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "kinder")
@Data
public class Kind extends Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate geburtsdatum;

    // Kommunikations-/Beteiligungsrelevantes (optional)
    private String hauptsprache;
    private Boolean brauchtDolmetsch; // oder enum

    @OneToMany(mappedBy = "kind", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<KindBezugspersonRelation> bezugspersonen = new ArrayList<>();

    @OneToMany(mappedBy = "kind", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Unterbringung> unterbringungen = new ArrayList<>();

    @OneToMany(mappedBy = "kind", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Gesundheitsmerkmal> gesundheitsmerkmale = new ArrayList<>();
}
