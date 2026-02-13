package org.thomcgn.backend.kinderschutz.forms.model;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.kinderschutz.catalog.KSItem;

import java.time.LocalDateTime;

@Entity
@Table(name = "ks_form_answer_revisions",
        indexes = @Index(name="idx_rev_instance_version", columnList="instance_id, instance_version"))
@Data
public class KSFormAnswerRevision {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="instance_id", nullable=false)
    private Long instanceId;

    @Column(name="instance_version", nullable=false)
    private Long instanceVersion;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name="item_id")
    private KSItem item;

    @Lob
    @Column(name="value_string")
    private String value;

    private LocalDateTime changedAt = LocalDateTime.now();
}
