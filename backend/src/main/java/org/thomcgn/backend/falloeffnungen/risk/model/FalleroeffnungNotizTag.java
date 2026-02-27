package org.thomcgn.backend.falloeffnungen.risk.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.falloeffnungen.model.FalleroeffnungNotiz;

@Entity
@Table(
        name = "falloeffnung_notiz_tags",
        indexes = {
                @Index(name = "ix_fall_notiz_tag_notiz", columnList = "notiz_id"),
                @Index(name = "ix_fall_notiz_tag_anlass", columnList = "anlass_code"),
                @Index(name = "ix_fall_notiz_tag_indicator", columnList = "indicator_id")
        }
)
public class FalleroeffnungNotizTag extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "notiz_id", nullable = false)
    private FalleroeffnungNotiz notiz;

    @Column(name = "anlass_code", length = 80)
    private String anlassCode;

    @Column(name = "indicator_id", length = 80)
    private String indicatorId;

    @Column(name = "severity")
    private Integer severity; // 0..3 (nullable wenn nur Anlass getaggt wird)

    public Long getId() { return id; }

    public FalleroeffnungNotiz getNotiz() { return notiz; }
    public void setNotiz(FalleroeffnungNotiz notiz) { this.notiz = notiz; }

    public String getAnlassCode() { return anlassCode; }
    public void setAnlassCode(String anlassCode) { this.anlassCode = anlassCode; }

    public String getIndicatorId() { return indicatorId; }
    public void setIndicatorId(String indicatorId) { this.indicatorId = indicatorId; }

    public Integer getSeverity() { return severity; }
    public void setSeverity(Integer severity) { this.severity = severity; }
}