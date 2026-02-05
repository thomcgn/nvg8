package org.thomcgn.backend.cases.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.thomcgn.backend.model.Person;

import java.time.LocalDate;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name="kinder")
@Data
public class Kind extends Person {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private LocalDate geburtsdatum;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "kinder_erziehungsperson",
            joinColumns = @JoinColumn(name = "kind_id"),
            inverseJoinColumns = @JoinColumn(name = "erziehungsperson_id")
    )
    private List<Erziehungsperson> erziehungspersonen;
}
