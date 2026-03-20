// backend/src/main/java/org/thomcgn/backend/people/model/Bezugsperson.java
package org.thomcgn.backend.people.model;

import jakarta.persistence.*;

import java.time.Instant;

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

    @Column(name = "aufenthaltsstatus", length = 50)
    private String aufenthaltsstatus;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public Long getId() {
        return id;
    }

    public BezugspersonBeziehung getBeziehung() {
        return beziehung;
    }

    public void setBeziehung(BezugspersonBeziehung beziehung) {
        this.beziehung = beziehung;
    }

    public String getAufenthaltsstatus() {
        return aufenthaltsstatus;
    }

    public void setAufenthaltsstatus(String aufenthaltsstatus) {
        this.aufenthaltsstatus = aufenthaltsstatus;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Instant deletedAt) {
        this.deletedAt = deletedAt;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }
}