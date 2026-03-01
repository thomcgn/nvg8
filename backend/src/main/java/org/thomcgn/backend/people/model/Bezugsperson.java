// backend/src/main/java/org/thomcgn/backend/people/model/Bezugsperson.java
package org.thomcgn.backend.people.model;

import jakarta.persistence.*;

@Entity
@Table(name = "bezugspersonen")
public class Bezugsperson extends BasePerson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Beziehung (falls ihr sie auf Bezugsperson direkt persistieren wollt).
     * DB-Spalte: bezugspersonen.beziehung
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "beziehung", length = 50)
    private BezugspersonBeziehung beziehung;

    public Long getId() {
        return id;
    }

    public BezugspersonBeziehung getBeziehung() {
        return beziehung;
    }

    public void setBeziehung(BezugspersonBeziehung beziehung) {
        this.beziehung = beziehung;
    }
}