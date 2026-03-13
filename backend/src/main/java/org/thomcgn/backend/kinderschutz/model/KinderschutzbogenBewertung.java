package org.thomcgn.backend.kinderschutz.model;

import jakarta.persistence.*;

@Entity
@Table(
        name = "kinderschutzbogen_bewertungen",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_skb_bew_assessment_item",
                columnNames = {"assessment_id", "item_code"}
        )
)
public class KinderschutzbogenBewertung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assessment_id", nullable = false)
    private KinderschutzbogenAssessment assessment;

    @Column(name = "item_code", nullable = false, length = 60)
    private String itemCode;

    @Column(name = "rating")
    private Short rating;

    @Column(name = "notiz")
    private String notiz;

    public Long getId() { return id; }

    public KinderschutzbogenAssessment getAssessment() { return assessment; }
    public void setAssessment(KinderschutzbogenAssessment assessment) { this.assessment = assessment; }

    public String getItemCode() { return itemCode; }
    public void setItemCode(String itemCode) { this.itemCode = itemCode; }

    public Short getRating() { return rating; }
    public void setRating(Short rating) { this.rating = rating; }

    public String getNotiz() { return notiz; }
    public void setNotiz(String notiz) { this.notiz = notiz; }
}
