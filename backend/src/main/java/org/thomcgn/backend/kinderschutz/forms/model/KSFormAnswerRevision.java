package org.thomcgn.backend.kinderschutz.forms.model;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.kinderschutz.catalog.KSItem;

import java.time.LocalDateTime;

@Entity
@Table(name = "ks_form_answer_revisions")
@Data
public class KSFormAnswerRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "instance_id")
    private KSFormInstance instance;

    @Column(name = "instance_version", nullable = false)
    private Long instanceVersion;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private KSItem item;

    @Lob
    @Column(name = "value_string")
    private String value;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;
}