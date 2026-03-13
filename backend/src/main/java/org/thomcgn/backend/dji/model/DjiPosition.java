package org.thomcgn.backend.dji.model;

import jakarta.persistence.*;

@Entity
@Table(
        name = "dji_positionen",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_dji_pos_assessment_code",
                columnNames = {"assessment_id", "position_code"}
        )
)
public class DjiPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assessment_id", nullable = false)
    private DjiAssessment assessment;

    @Column(name = "position_code", nullable = false, length = 80)
    private String positionCode;

    /** Freitextfeld für fachliche Belege / Begründung. */
    @Column(name = "belege")
    private String belege;

    /** Für binäre Kriterien (BOOLEAN_MIT_BELEGE). */
    @Column(name = "bewertung_bool")
    private Boolean bewertungBool;

    /** Für die 6-stufige Skala (SECHSSTUFEN): 0–5. */
    @Column(name = "bewertung_stufe")
    private Short bewertungStufe;

    public Long getId() { return id; }

    public DjiAssessment getAssessment() { return assessment; }
    public void setAssessment(DjiAssessment assessment) { this.assessment = assessment; }

    public String getPositionCode() { return positionCode; }
    public void setPositionCode(String positionCode) { this.positionCode = positionCode; }

    public String getBelege() { return belege; }
    public void setBelege(String belege) { this.belege = belege; }

    public Boolean getBewertungBool() { return bewertungBool; }
    public void setBewertungBool(Boolean bewertungBool) { this.bewertungBool = bewertungBool; }

    public Short getBewertungStufe() { return bewertungStufe; }
    public void setBewertungStufe(Short bewertungStufe) { this.bewertungStufe = bewertungStufe; }
}
