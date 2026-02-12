package org.thomcgn.backend.kinderschutz.forms.model;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.kinderschutz.casework.TriState;
import org.thomcgn.backend.kinderschutz.catalog.KSItem;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ks_form_answers",
        uniqueConstraints = @UniqueConstraint(name = "uq_ks_form_answers_instance_item", columnNames = {"instance_id","item_id"}))
@Data
public class KSFormAnswer {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "instance_id")
    private KSFormInstance instance;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private KSItem item;

    @Enumerated(EnumType.STRING)
    @Column(name = "tri_state")
    private TriState triState;

    @Lob
    @Column(name = "value_text")
    private String valueText;

    @Column(name = "value_date")
    private LocalDate valueDate;

    @Column(name = "value_user_ref")
    private String valueUserRef;

    @Lob
    private String comment;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    @PrePersist
    void touch() { this.updatedAt = LocalDateTime.now(); }
}
