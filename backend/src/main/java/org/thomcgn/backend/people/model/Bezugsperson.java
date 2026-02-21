package org.thomcgn.backend.people.model;

import jakarta.persistence.*;

@Entity
@Table(name = "bezugspersonen")
public class Bezugsperson extends BasePerson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private BezugspersonBeziehung beziehung;

    public Long getId() { return id; }

    public BezugspersonBeziehung getBeziehung() { return beziehung; }
    public void setBeziehung(BezugspersonBeziehung beziehung) { this.beziehung = beziehung; }
}