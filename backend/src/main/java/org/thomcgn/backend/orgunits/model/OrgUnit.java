package org.thomcgn.backend.orgunits.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.tenants.model.Traeger;

@Entity
@Table(
        name = "org_units",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_orgunit_traeger_parent_name",
                columnNames = {"traeger_id", "parent_id", "name"}
        ),
        indexes = {
                @Index(name = "ix_orgunit_traeger_type", columnList = "traeger_id,type"),
                @Index(name = "ix_orgunit_parent", columnList = "parent_id")
        }
)
public class OrgUnit extends AuditableEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "traeger_id", nullable = false)
    private Traeger traeger;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrgUnitType type;

    @Column(nullable = false, length = 120)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private OrgUnit parent;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(length = 200) private String strasse;
    @Column(length = 20)  private String hausnummer;
    @Column(length = 10)  private String plz;
    @Column(length = 100) private String ort;
    @Column(length = 200) private String leitung;
    @Column(length = 200) private String ansprechpartner;

    public Long getId()              { return id; }
    public Traeger getTraeger()      { return traeger; }
    public OrgUnitType getType()     { return type; }
    public String getName()          { return name; }
    public OrgUnit getParent()       { return parent; }
    public boolean isEnabled()       { return enabled; }
    public String getStrasse()       { return strasse; }
    public String getHausnummer()    { return hausnummer; }
    public String getPlz()           { return plz; }
    public String getOrt()           { return ort; }
    public String getLeitung()       { return leitung; }
    public String getAnsprechpartner(){ return ansprechpartner; }

    public void setTraeger(Traeger v)      { this.traeger = v; }
    public void setType(OrgUnitType v)     { this.type = v; }
    public void setName(String v)          { this.name = v; }
    public void setParent(OrgUnit v)       { this.parent = v; }
    public void setEnabled(boolean v)      { this.enabled = v; }
    public void setStrasse(String v)       { this.strasse = v; }
    public void setHausnummer(String v)    { this.hausnummer = v; }
    public void setPlz(String v)           { this.plz = v; }
    public void setOrt(String v)           { this.ort = v; }
    public void setLeitung(String v)       { this.leitung = v; }
    public void setAnsprechpartner(String v){ this.ansprechpartner = v; }
}