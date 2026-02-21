package org.thomcgn.backend.aktenzeichen.model;

import jakarta.persistence.*;

@Entity
@Table(
        name = "traeger_aktennummer_seq",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_seq_traeger_year",
                columnNames = {"traeger_id", "year"}
        )
)
public class TraegerAktennummerSequence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "traeger_id", nullable = false)
    private Long traegerId;

    @Column(nullable = false)
    private int year;

    @Column(name = "next_value", nullable = false)
    private long nextValue = 1;

    public Long getId() { return id; }
    public Long getTraegerId() { return traegerId; }
    public void setTraegerId(Long traegerId) { this.traegerId = traegerId; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public long getNextValue() { return nextValue; }
    public void setNextValue(long nextValue) { this.nextValue = nextValue; }
}