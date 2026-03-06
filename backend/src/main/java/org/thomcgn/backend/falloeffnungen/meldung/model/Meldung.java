package org.thomcgn.backend.falloeffnungen.meldung.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.risk.model.FalleroeffnungRiskSnapshot;
import org.thomcgn.backend.users.model.User;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "meldungen",
        uniqueConstraints = {
                @UniqueConstraint(name="uq_meldung_version", columnNames = {"falloeffnung_id", "version_no"})
        },
        indexes = {
                @Index(name="ix_meldung_fall", columnList="falloeffnung_id"),
                @Index(name="ix_meldung_current", columnList="falloeffnung_id,current"),
                @Index(name="ix_meldung_corrects", columnList="corrects_id")
        }
)
public class Meldung extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    @Column(name = "row_version", nullable = false)
    private long rowVersion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="falloeffnung_id", nullable = false)
    private Falleroeffnung falleroeffnung;

    @Column(name="version_no", nullable = false)
    private Integer versionNo;

    @Column(nullable = false)
    private boolean current = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MeldungStatus status = MeldungStatus.ENTWURF;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MeldungType type = MeldungType.MELDUNG;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="supersedes_id")
    private Meldung supersedes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="corrects_id")
    private Meldung corrects;

    // ===== Version-Metadaten =====

    @Enumerated(EnumType.STRING)
    @Column(name = "change_reason", length = 20)
    private MeldungChangeReason changeReason;

    /**
     * Zeitpunkt, ab dem die neue Information fachlich wirksam wurde.
     * Für FIX typischerweise null.
     */
    @Column(name = "info_effective_at")
    private Instant infoEffectiveAt;

    /**
     * Freitextbegründung (z.B. bei kritischen Änderungen / Neubewertung).
     */
    @Column(name = "reason_text", columnDefinition = "text")
    private String reasonText;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="created_by_user_id", nullable = false)
    private User createdBy;

    @Column(nullable = false, length = 200)
    private String createdByDisplayName;

    @Column(length = 50)
    private String erfasstVonRolle;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Meldeweg meldeweg;

    @Column(name="meldeweg_sonstiges", columnDefinition = "text")
    private String meldewegSonstiges;

    @Column(name="meldende_stelle_kontakt", columnDefinition = "text")
    private String meldendeStelleKontakt;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Dringlichkeit dringlichkeit;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Datenbasis datenbasis;

    private Boolean einwilligungVorhanden;

    private Boolean schweigepflichtentbindungVorhanden;

    @Column(nullable = false, length = 4000)
    private String kurzbeschreibung = "";

    @Enumerated(EnumType.STRING)
    @Column(name="fach_ampel", length = 20)
    private AmpelStatus fachAmpel;

    @Column(name="fach_text", length = 4000)
    private String fachText;

    @Enumerated(EnumType.STRING)
    @Column(name="abweichung_zur_auto", length = 40)
    private AbweichungZurAutoAmpel abweichungZurAuto;

    @Column(name="abweichungs_begruendung", columnDefinition = "text")
    private String abweichungsBegruendung;

    @Column(name="akut_gefahr_im_verzug", nullable = false)
    private boolean akutGefahrImVerzug = false;

    @Column(name="akut_begruendung", columnDefinition = "text")
    private String akutBegruendung;

    @Column(name="akut_notruf_erforderlich")
    private Boolean akutNotrufErforderlich;

    @Enumerated(EnumType.STRING)
    @Column(name="akut_kind_sicher_untergebracht", length = 20)
    private JaNeinUnklar akutKindSicherUntergebracht;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="verantwortliche_fachkraft_user_id")
    private User verantwortlicheFachkraft;

    @Column(name="naechste_ueberpruefung_am")
    private LocalDate naechsteUeberpruefungAm;

    @Column(columnDefinition = "text")
    private String zusammenfassung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="auto_risk_snapshot_id")
    private FalleroeffnungRiskSnapshot autoRiskSnapshot;

    private Instant submittedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="submitted_by_user_id")
    private User submittedBy;

    @Column(length = 200)
    private String submittedByDisplayName;

    private Instant freigabeAm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="freigabe_von_user_id")
    private User freigabeVon;

    // Getters/Setters

    public Long getId() { return id; }

    public Falleroeffnung getFalleroeffnung() { return falleroeffnung; }
    public void setFalleroeffnung(Falleroeffnung falleroeffnung) { this.falleroeffnung = falleroeffnung; }

    public Integer getVersionNo() { return versionNo; }
    public void setVersionNo(Integer versionNo) { this.versionNo = versionNo; }

    public boolean isCurrent() { return current; }
    public void setCurrent(boolean current) { this.current = current; }

    public MeldungStatus getStatus() { return status; }
    public void setStatus(MeldungStatus status) { this.status = status; }

    public MeldungType getType() { return type; }
    public void setType(MeldungType type) { this.type = type; }

    public Meldung getSupersedes() { return supersedes; }
    public void setSupersedes(Meldung supersedes) { this.supersedes = supersedes; }

    public Meldung getCorrects() { return corrects; }
    public void setCorrects(Meldung corrects) { this.corrects = corrects; }

    public MeldungChangeReason getChangeReason() { return changeReason; }
    public void setChangeReason(MeldungChangeReason changeReason) { this.changeReason = changeReason; }

    public Instant getInfoEffectiveAt() { return infoEffectiveAt; }
    public void setInfoEffectiveAt(Instant infoEffectiveAt) { this.infoEffectiveAt = infoEffectiveAt; }

    public String getReasonText() { return reasonText; }
    public void setReasonText(String reasonText) { this.reasonText = reasonText; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public String getCreatedByDisplayName() { return createdByDisplayName; }
    public void setCreatedByDisplayName(String createdByDisplayName) { this.createdByDisplayName = createdByDisplayName; }

    public String getErfasstVonRolle() { return erfasstVonRolle; }
    public void setErfasstVonRolle(String erfasstVonRolle) { this.erfasstVonRolle = erfasstVonRolle; }

    public Meldeweg getMeldeweg() { return meldeweg; }
    public void setMeldeweg(Meldeweg meldeweg) { this.meldeweg = meldeweg; }

    public String getMeldewegSonstiges() { return meldewegSonstiges; }
    public void setMeldewegSonstiges(String meldewegSonstiges) { this.meldewegSonstiges = meldewegSonstiges; }

    public String getMeldendeStelleKontakt() { return meldendeStelleKontakt; }
    public void setMeldendeStelleKontakt(String meldendeStelleKontakt) { this.meldendeStelleKontakt = meldendeStelleKontakt; }

    public Dringlichkeit getDringlichkeit() { return dringlichkeit; }
    public void setDringlichkeit(Dringlichkeit dringlichkeit) { this.dringlichkeit = dringlichkeit; }

    public Datenbasis getDatenbasis() { return datenbasis; }
    public void setDatenbasis(Datenbasis datenbasis) { this.datenbasis = datenbasis; }

    public Boolean getEinwilligungVorhanden() { return einwilligungVorhanden; }
    public void setEinwilligungVorhanden(Boolean einwilligungVorhanden) { this.einwilligungVorhanden = einwilligungVorhanden; }

    public Boolean getSchweigepflichtentbindungVorhanden() { return schweigepflichtentbindungVorhanden; }
    public void setSchweigepflichtentbindungVorhanden(Boolean schweigepflichtentbindungVorhanden) { this.schweigepflichtentbindungVorhanden = schweigepflichtentbindungVorhanden; }

    public String getKurzbeschreibung() { return kurzbeschreibung; }
    public void setKurzbeschreibung(String kurzbeschreibung) { this.kurzbeschreibung = kurzbeschreibung == null ? "" : kurzbeschreibung; }

    public AmpelStatus getFachAmpel() { return fachAmpel; }
    public void setFachAmpel(AmpelStatus fachAmpel) { this.fachAmpel = fachAmpel; }

    public String getFachText() { return fachText; }
    public void setFachText(String fachText) { this.fachText = fachText; }

    public AbweichungZurAutoAmpel getAbweichungZurAuto() { return abweichungZurAuto; }
    public void setAbweichungZurAuto(AbweichungZurAutoAmpel abweichungZurAuto) { this.abweichungZurAuto = abweichungZurAuto; }

    public String getAbweichungsBegruendung() { return abweichungsBegruendung; }
    public void setAbweichungsBegruendung(String abweichungsBegruendung) { this.abweichungsBegruendung = abweichungsBegruendung; }

    public boolean isAkutGefahrImVerzug() { return akutGefahrImVerzug; }
    public void setAkutGefahrImVerzug(boolean akutGefahrImVerzug) { this.akutGefahrImVerzug = akutGefahrImVerzug; }

    public String getAkutBegruendung() { return akutBegruendung; }
    public void setAkutBegruendung(String akutBegruendung) { this.akutBegruendung = akutBegruendung; }

    public Boolean getAkutNotrufErforderlich() { return akutNotrufErforderlich; }
    public void setAkutNotrufErforderlich(Boolean akutNotrufErforderlich) { this.akutNotrufErforderlich = akutNotrufErforderlich; }

    public JaNeinUnklar getAkutKindSicherUntergebracht() { return akutKindSicherUntergebracht; }
    public void setAkutKindSicherUntergebracht(JaNeinUnklar akutKindSicherUntergebracht) { this.akutKindSicherUntergebracht = akutKindSicherUntergebracht; }

    public User getVerantwortlicheFachkraft() { return verantwortlicheFachkraft; }
    public void setVerantwortlicheFachkraft(User verantwortlicheFachkraft) { this.verantwortlicheFachkraft = verantwortlicheFachkraft; }

    public LocalDate getNaechsteUeberpruefungAm() { return naechsteUeberpruefungAm; }
    public void setNaechsteUeberpruefungAm(LocalDate naechsteUeberpruefungAm) { this.naechsteUeberpruefungAm = naechsteUeberpruefungAm; }

    public String getZusammenfassung() { return zusammenfassung; }
    public void setZusammenfassung(String zusammenfassung) { this.zusammenfassung = zusammenfassung; }

    public FalleroeffnungRiskSnapshot getAutoRiskSnapshot() { return autoRiskSnapshot; }
    public void setAutoRiskSnapshot(FalleroeffnungRiskSnapshot autoRiskSnapshot) { this.autoRiskSnapshot = autoRiskSnapshot; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public User getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(User submittedBy) { this.submittedBy = submittedBy; }

    public String getSubmittedByDisplayName() { return submittedByDisplayName; }
    public void setSubmittedByDisplayName(String submittedByDisplayName) { this.submittedByDisplayName = submittedByDisplayName; }

    public Instant getFreigabeAm() { return freigabeAm; }
    public void setFreigabeAm(Instant freigabeAm) { this.freigabeAm = freigabeAm; }

    public User getFreigabeVon() { return freigabeVon; }
    public void setFreigabeVon(User freigabeVon) { this.freigabeVon = freigabeVon; }
}