package org.thomcgn.backend.schutzplan.model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "schutzplan_massnahmen",
        indexes = @Index(name = "ix_schutzplan_massnahme_plan", columnList = "schutzplan_id"))
public class SchutzplanMassnahme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "schutzplan_id", nullable = false)
    private Schutzplan schutzplan;

    @Column(name = "position", nullable = false)
    private short position;

    @Column(name = "massnahme", nullable = false)
    private String massnahme;

    @Column(name = "verantwortlich", length = 200)
    private String verantwortlich;

    @Column(name = "bis_datum")
    private LocalDate bisDatum;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "OFFEN";

    public Long getId() { return id; }

    public Schutzplan getSchutzplan() { return schutzplan; }
    public void setSchutzplan(Schutzplan schutzplan) { this.schutzplan = schutzplan; }

    public short getPosition() { return position; }
    public void setPosition(short position) { this.position = position; }

    public String getMassnahme() { return massnahme; }
    public void setMassnahme(String massnahme) { this.massnahme = massnahme; }

    public String getVerantwortlich() { return verantwortlich; }
    public void setVerantwortlich(String verantwortlich) { this.verantwortlich = verantwortlich; }

    public LocalDate getBisDatum() { return bisDatum; }
    public void setBisDatum(LocalDate bisDatum) { this.bisDatum = bisDatum; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
