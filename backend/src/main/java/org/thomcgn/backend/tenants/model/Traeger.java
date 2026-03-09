package org.thomcgn.backend.tenants.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

@Entity
@Table(
        name = "traeger",
        uniqueConstraints = @UniqueConstraint(name = "uk_traeger_slug", columnNames = "slug")
)
public class Traeger extends AuditableEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 80)
    private String slug;

    @Column(length = 200)
    private String aktenPrefix;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(length = 40)
    private String kurzcode;

    @Column(length = 200) private String strasse;
    @Column(length = 20)  private String hausnummer;
    @Column(length = 10)  private String plz;
    @Column(length = 100) private String ort;
    @Column(length = 200) private String leitung;
    @Column(length = 200) private String ansprechpartner;

    public String getKurzcode()       { return kurzcode; }
    public String getAktenPrefix()    { return aktenPrefix; }
    public Long   getId()             { return id; }
    public String getName()           { return name; }
    public String getSlug()           { return slug; }
    public boolean isEnabled()        { return enabled; }
    public String getStrasse()        { return strasse; }
    public String getHausnummer()     { return hausnummer; }
    public String getPlz()            { return plz; }
    public String getOrt()            { return ort; }
    public String getLeitung()        { return leitung; }
    public String getAnsprechpartner(){ return ansprechpartner; }

    public void setKurzcode(String v)        { this.kurzcode = v; }
    public void setName(String v)            { this.name = v; }
    public void setSlug(String v)            { this.slug = v; }
    public void setAktenPrefix(String v)     { this.aktenPrefix = v; }
    public void setEnabled(boolean v)        { this.enabled = v; }
    public void setStrasse(String v)         { this.strasse = v; }
    public void setHausnummer(String v)      { this.hausnummer = v; }
    public void setPlz(String v)             { this.plz = v; }
    public void setOrt(String v)             { this.ort = v; }
    public void setLeitung(String v)         { this.leitung = v; }
    public void setAnsprechpartner(String v) { this.ansprechpartner = v; }
}