package org.thomcgn.backend.falloeffnungen.risk.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;

import java.math.BigDecimal;

@Entity
@Table(
        name = "falloeffnung_risk_snapshots",
        indexes = {
                @Index(name = "ix_fall_risk_fall", columnList = "falloeffnung_id,created_at")
        }
)
public class FalleroeffnungRiskSnapshot extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "falloeffnung_id", nullable = false)
    private Falleroeffnung falleroeffnung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id")
    private TraegerRiskMatrixConfig config;

    @Column(name = "config_version", nullable = false, length = 40)
    private String configVersion;

    @Column(name = "raw_score", nullable = false)
    private double rawScore;

    @Column(name = "protective_reduction", nullable = false)
    private double protectiveReduction;

    @Column(name = "final_score", precision = 10, scale = 4) // scale nach Bedarf
    private BigDecimal finalScore;

    @Column(name = "traffic_light", nullable = false, length = 10)
    private String trafficLight; // GRUEN|GELB|ROT

    @Column(name = "rationale_json", length = 200000)
    private String rationaleJson;

    @Column(name = "hard_hits_json", length = 200000)
    private String hardHitsJson;

    @Column(name = "dimensions_json", length = 200000)
    private String dimensionsJson;

    public Long getId() { return id; }

    public Falleroeffnung getFalleroeffnung() { return falleroeffnung; }
    public void setFalleroeffnung(Falleroeffnung falleroeffnung) { this.falleroeffnung = falleroeffnung; }

    public TraegerRiskMatrixConfig getConfig() { return config; }
    public void setConfig(TraegerRiskMatrixConfig config) { this.config = config; }

    public String getConfigVersion() { return configVersion; }
    public void setConfigVersion(String configVersion) { this.configVersion = configVersion; }

    public double getRawScore() { return rawScore; }
    public void setRawScore(double rawScore) { this.rawScore = rawScore; }

    public double getProtectiveReduction() { return protectiveReduction; }
    public void setProtectiveReduction(double protectiveReduction) { this.protectiveReduction = protectiveReduction; }

    public BigDecimal getFinalScore() { return finalScore; }
    public void setFinalScore(BigDecimal finalScore) { this.finalScore = finalScore; }

    public String getTrafficLight() { return trafficLight; }
    public void setTrafficLight(String trafficLight) { this.trafficLight = trafficLight; }

    public String getRationaleJson() { return rationaleJson; }
    public void setRationaleJson(String rationaleJson) { this.rationaleJson = rationaleJson; }

    public String getHardHitsJson() { return hardHitsJson; }
    public void setHardHitsJson(String hardHitsJson) { this.hardHitsJson = hardHitsJson; }

    public String getDimensionsJson() { return dimensionsJson; }
    public void setDimensionsJson(String dimensionsJson) { this.dimensionsJson = dimensionsJson; }
}