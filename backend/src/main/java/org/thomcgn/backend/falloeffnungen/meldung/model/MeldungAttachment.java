package org.thomcgn.backend.falloeffnungen.meldung.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

@Entity
@Table(name="meldung_attachments", indexes = {
        @Index(name="ix_meldung_attachments_meldung", columnList="meldung_id")
})
public class MeldungAttachment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="meldung_id", nullable = false)
    private Meldung meldung;

    @Column(name="file_id", nullable = false)
    private Long fileId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AttachmentTyp typ;

    @Column(columnDefinition = "text")
    private String titel;

    @Column(columnDefinition = "text")
    private String beschreibung;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Sichtbarkeit sichtbarkeit = Sichtbarkeit.INTERN;

    @Column(name="rechtsgrundlage_hinweis", columnDefinition = "text")
    private String rechtsgrundlageHinweis;

    public Long getId() { return id; }

    public Meldung getMeldung() { return meldung; }
    public void setMeldung(Meldung meldung) { this.meldung = meldung; }

    public Long getFileId() { return fileId; }
    public void setFileId(Long fileId) { this.fileId = fileId; }

    public AttachmentTyp getTyp() { return typ; }
    public void setTyp(AttachmentTyp typ) { this.typ = typ; }

    public String getTitel() { return titel; }
    public void setTitel(String titel) { this.titel = titel; }

    public String getBeschreibung() { return beschreibung; }
    public void setBeschreibung(String beschreibung) { this.beschreibung = beschreibung; }

    public Sichtbarkeit getSichtbarkeit() { return sichtbarkeit; }
    public void setSichtbarkeit(Sichtbarkeit sichtbarkeit) { this.sichtbarkeit = sichtbarkeit == null ? Sichtbarkeit.INTERN : sichtbarkeit; }

    public String getRechtsgrundlageHinweis() { return rechtsgrundlageHinweis; }
    public void setRechtsgrundlageHinweis(String rechtsgrundlageHinweis) { this.rechtsgrundlageHinweis = rechtsgrundlageHinweis; }
}