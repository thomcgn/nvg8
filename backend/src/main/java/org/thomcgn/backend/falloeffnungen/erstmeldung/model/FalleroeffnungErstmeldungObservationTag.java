package org.thomcgn.backend.falloeffnungen.erstmeldung.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

@Entity
@Table(
        name = "falloeffnung_erstmeldung_observation_tags",
        indexes = {
                @Index(name = "ix_erstmeldung_obs_tag_obs", columnList = "observation_id"),
                @Index(name = "ix_erstmeldung_obs_tag_anlass", columnList = "anlass_code"),
                @Index(name = "ix_erstmeldung_obs_tag_indicator", columnList = "indicator_id")
        }
)
public class FalleroeffnungErstmeldungObservationTag extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "observation_id", nullable = false)
    private FalleroeffnungErstmeldungObservation observation;

    @Column(name = "anlass_code", length = 80)
    private String anlassCode;

    @Column(name = "indicator_id", length = 80)
    private String indicatorId;

    private Integer severity; // 0..3
    @Column(columnDefinition = "text")
    private String comment;

    public Long getId() { return id; }

    public FalleroeffnungErstmeldungObservation getObservation() { return observation; }
    public void setObservation(FalleroeffnungErstmeldungObservation observation) { this.observation = observation; }

    public String getAnlassCode() { return anlassCode; }
    public void setAnlassCode(String anlassCode) { this.anlassCode = anlassCode; }

    public String getIndicatorId() { return indicatorId; }
    public void setIndicatorId(String indicatorId) { this.indicatorId = indicatorId; }

    public Integer getSeverity() { return severity; }
    public void setSeverity(Integer severity) { this.severity = severity; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}