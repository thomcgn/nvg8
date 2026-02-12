package org.thomcgn.backend.cases.model;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.model.Person;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bezugspersonen")
@Data
public class Bezugsperson extends Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // optional
    private String organisation; // z.B. Einrichtung/Träger falls Fachkraft/Betreuung

    @OneToMany(mappedBy = "bezugsperson", fetch = FetchType.LAZY)
    private List<KindBezugspersonRelation> kinder = new ArrayList<>();
}
