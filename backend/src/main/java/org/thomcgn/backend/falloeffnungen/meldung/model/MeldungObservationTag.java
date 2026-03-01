package org.thomcgn.backend.falloeffnungen.meldung.model;

import jakarta.persistence.*;

@Entity
@Table(name="meldung_observation_tags",
        indexes = {
                @Index(name="ix_meldung_obs_tag_obs", columnList="observation_id")
        })
public class MeldungObservationTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="observation_id", nullable = false)
    private MeldungObservation observation;

    @Column(name="anlass_code", length = 100)
    private String anlassCode;

    @Column(name="indicator_id", length = 200)
    private String indicatorId;

    private Integer severity;

    @Column(length = 4000)
    private String comment;

    public Long getId() { return id; }

    public MeldungObservation getObservation() { return observation; }
    public void setObservation(MeldungObservation observation) { this.observation = observation; }

    public String getAnlassCode() { return anlassCode; }
    public void setAnlassCode(String anlassCode) { this.anlassCode = anlassCode; }

    public String getIndicatorId() { return indicatorId; }
    public void setIndicatorId(String indicatorId) { this.indicatorId = indicatorId; }

    public Integer getSeverity() { return severity; }
    public void setSeverity(Integer severity) { this.severity = severity; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}