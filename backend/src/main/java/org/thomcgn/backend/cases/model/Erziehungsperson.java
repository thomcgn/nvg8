package org.thomcgn.backend.cases.model;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.model.Person;

import java.util.List;

@Entity
@Table(name="erziehungspersonen")
@Data
public class Erziehungsperson extends Person {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToMany(mappedBy = "erziehungspersonen", fetch = FetchType.LAZY)
    private List<Kind> kinder;

    @Enumerated(EnumType.STRING)
    private ErziehungsRolle rolle; // z.B. ELTERN, BETREUER, PFLEGESCHWESTER
}
