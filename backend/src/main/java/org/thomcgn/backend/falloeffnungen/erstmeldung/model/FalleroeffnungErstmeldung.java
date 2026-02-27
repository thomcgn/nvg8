package org.thomcgn.backend.falloeffnungen.erstmeldung.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.risk.model.FalleroeffnungRiskSnapshot;
import org.thomcgn.backend.users.model.User;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "falloeffnung_erstmeldungen",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_erstmeldung_version", columnNames = {"falloeffnung_id", "version_no"})
        },
        indexes = {
                @Index(name = "ix_erstmeldung_fall_version_desc", columnList = "falloeffnung_id,version_no"),
                @Index(name = "ix_erstmeldung_fall_current", columnList = "falloeffnung_id,is_current")
        }
)
public class FalleroeffnungErstmeldung extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "falloeffnung_id", nullable = false)
    private Falleroeffnung falleroeffnung;

    @Column(name = "version_no", nullable = false)
    private int versionNo;

    @Column(name = "is_current", nullable = false)
    private boolean current;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supersedes_id")
    private FalleroeffnungErstmeldung supersedes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ErstmeldungStatus status;

    @Column(name = "erfasst_am", nullable = false)
    private Instant erfasstAm;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "erfasst_von_user_id", nullable = false)
    private User erfasstVon;

    @Column(name = "erfasst_von_rolle", nullable = false, length = 80)
    private String erfasstVonRolle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 80)
    private Meldeweg meldeweg;

    @Column(name = "meldeweg_sonstiges")
    private String meldewegSonstiges;

    @Column(name = "meldende_stelle_kontakt")
    private String meldendeStelleKontakt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Dringlichkeit dringlichkeit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 80)
    private Datenbasis datenbasis;

    @Column(name = "einwilligung_vorhanden")
    private Boolean einwilligungVorhanden;

    @Column(name = "schweigepflichtentbindung_vorhanden")
    private Boolean schweigepflichtentbindungVorhanden;

    @Column(nullable = false, columnDefinition = "text")
    private String kurzbeschreibung;

    @Enumerated(EnumType.STRING)
    @Column(name = "fach_ampel", length = 20)
    private AmpelStatus fachAmpel;

    @Column(name = "fach_text", columnDefinition = "text")
    private String fachText;

    @Enumerated(EnumType.STRING)
    @Column(name = "abweichung_zur_auto", length = 40)
    private AbweichungZurAutoAmpel abweichungZurAuto;

    @Column(name = "abweichungs_begruendung", columnDefinition = "text")
    private String abweichungsBegruendung;

    @Column(name = "akut_gefahr_im_verzug", nullable = false)
    private boolean akutGefahrImVerzug = false;

    @Column(name = "akut_begruendung", columnDefinition = "text")
    private String akutBegruendung;

    @Column(name = "akut_notruf_erforderlich")
    private Boolean akutNotrufErforderlich;

    @Enumerated(EnumType.STRING)
    @Column(name = "akut_kind_sicher_untergebracht", length = 20)
    private JaNeinUnklar akutKindSicherUntergebracht;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auto_risk_snapshot_id")
    private FalleroeffnungRiskSnapshot autoRiskSnapshot;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_user_id")
    private User submittedBy;

    @Column(name = "freigabe_am")
    private Instant freigabeAm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freigabe_von_user_id")
    private User freigabeVon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verantwortliche_fachkraft_user_id")
    private User verantwortlicheFachkraft;

    @Column(name = "naechste_ueberpruefung_am")
    private LocalDate naechsteUeberpruefungAm;

    @Column(columnDefinition = "text")
    private String zusammenfassung;

    public Long getId() { return id; }

    public Falleroeffnung getFalleroeffnung() { return falleroeffnung; }
    public void setFalleroeffnung(Falleroeffnung falleroeffnung) { this.falleroeffnung = falleroeffnung; }

    public int getVersionNo() { return versionNo; }
    public void setVersionNo(int versionNo) { this.versionNo = versionNo; }

    public boolean isCurrent() { return current; }
    public void setCurrent(boolean current) { this.current = current; }

    public FalleroeffnungErstmeldung getSupersedes() { return supersedes; }
    public void setSupersedes(FalleroeffnungErstmeldung supersedes) { this.supersedes = supersedes; }

    public ErstmeldungStatus getStatus() { return status; }
    public void setStatus(ErstmeldungStatus status) { this.status = status; }

    public Instant getErfasstAm() { return erfasstAm; }
    public void setErfasstAm(Instant erfasstAm) { this.erfasstAm = erfasstAm; }

    public User getErfasstVon() { return erfasstVon; }
    public void setErfasstVon(User erfasstVon) { this.erfasstVon = erfasstVon; }

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
    public void setKurzbeschreibung(String kurzbeschreibung) { this.kurzbeschreibung = kurzbeschreibung; }

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

    public FalleroeffnungRiskSnapshot getAutoRiskSnapshot() { return autoRiskSnapshot; }
    public void setAutoRiskSnapshot(FalleroeffnungRiskSnapshot autoRiskSnapshot) { this.autoRiskSnapshot = autoRiskSnapshot; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public User getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(User submittedBy) { this.submittedBy = submittedBy; }

    public Instant getFreigabeAm() { return freigabeAm; }
    public void setFreigabeAm(Instant freigabeAm) { this.freigabeAm = freigabeAm; }

    public User getFreigabeVon() { return freigabeVon; }
    public void setFreigabeVon(User freigabeVon) { this.freigabeVon = freigabeVon; }

    public User getVerantwortlicheFachkraft() { return verantwortlicheFachkraft; }
    public void setVerantwortlicheFachkraft(User verantwortlicheFachkraft) { this.verantwortlicheFachkraft = verantwortlicheFachkraft; }

    public LocalDate getNaechsteUeberpruefungAm() { return naechsteUeberpruefungAm; }
    public void setNaechsteUeberpruefungAm(LocalDate naechsteUeberpruefungAm) { this.naechsteUeberpruefungAm = naechsteUeberpruefungAm; }

    public String getZusammenfassung() { return zusammenfassung; }
    public void setZusammenfassung(String zusammenfassung) { this.zusammenfassung = zusammenfassung; }
}