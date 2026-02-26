package org.thomcgn.backend.people.model;

import jakarta.persistence.*;

@Entity
@Table(name = "bezugspersonen")
public class Bezugsperson extends BasePerson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public Long getId() { return id; }
}