package org.thomcgn.backend.people.model;

import jakarta.persistence.*;

@Entity
@Table(name = "kinder")
public class Kind extends BasePerson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Kind-spezifisch:
    @Column(nullable = false)
    private boolean foerderbedarf = false;

    @Column(length = 1000)
    private String foerderbedarfDetails;

    // optional: medizinische/entwicklungsbezogene Hinweise (MVP)
    @Column(length = 1000)
    private String gesundheitsHinweise;

    @OneToMany(mappedBy = "kind", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.Set<KindBezugsperson> bezugspersonBeziehungen = new java.util.HashSet<>();

    public Long getId() { return id; }

    public boolean isFoerderbedarf() { return foerderbedarf; }
    public void setFoerderbedarf(boolean foerderbedarf) { this.foerderbedarf = foerderbedarf; }

    public String getFoerderbedarfDetails() { return foerderbedarfDetails; }
    public void setFoerderbedarfDetails(String foerderbedarfDetails) { this.foerderbedarfDetails = foerderbedarfDetails; }

    public String getGesundheitsHinweise() { return gesundheitsHinweise; }
    public void setGesundheitsHinweise(String gesundheitsHinweise) { this.gesundheitsHinweise = gesundheitsHinweise; }
}