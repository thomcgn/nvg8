package org.thomcgn.backend.tenants.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

@Entity
@Table(
        name = "traeger_risk_indicators",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_traeger_indicator",
                columnNames = {"traeger_id", "indicator_id"}
        )
)
public class TraegerRiskIndicator extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "traeger_id", nullable = false)
    private Traeger traeger;

    @Column(name = "indicator_id", nullable = false, length = 120)
    private String indicatorId;

    @Column(nullable = false, length = 220)
    private String label;

    @Column(columnDefinition = "text")
    private String description;

    @Column(length = 120)
    private String category;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "default_severity")
    private Short defaultSeverity; // 0..3 optional

    public Long getId() { return id; }
    public Traeger getTraeger() { return traeger; }
    public String getIndicatorId() { return indicatorId; }
    public String getLabel() { return label; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public boolean isEnabled() { return enabled; }
    public int getSortOrder() { return sortOrder; }
    public Short getDefaultSeverity() { return defaultSeverity; }

    public void setTraeger(Traeger traeger) { this.traeger = traeger; }
    public void setIndicatorId(String indicatorId) { this.indicatorId = indicatorId; }
    public void setLabel(String label) { this.label = label; }
    public void setDescription(String description) { this.description = description; }
    public void setCategory(String category) { this.category = category; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public void setDefaultSeverity(Short defaultSeverity) { this.defaultSeverity = defaultSeverity; }
}