package org.thomcgn.backend.cases.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.thomcgn.backend.users.model.Person;

import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
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
