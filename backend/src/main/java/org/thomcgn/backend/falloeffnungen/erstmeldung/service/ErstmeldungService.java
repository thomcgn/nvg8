package org.thomcgn.backend.falloeffnungen.erstmeldung.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.falloeffnungen.erstmeldung.dto.*;
import org.thomcgn.backend.falloeffnungen.erstmeldung.model.*;
import org.thomcgn.backend.falloeffnungen.erstmeldung.repo.*;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.model.FalleroeffnungNotiz;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungNotizRepository;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.falloeffnungen.risk.AnlassCatalog;
import org.thomcgn.backend.falloeffnungen.risk.model.FalleroeffnungNotizTag;
import org.thomcgn.backend.falloeffnungen.risk.repo.FalleroeffnungNotizTagRepository;
import org.thomcgn.backend.falloeffnungen.risk.service.FallRiskService;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class ErstmeldungService {

    private final FalleroeffnungRepository fallRepo;
    private final FalleroeffnungNotizRepository notizRepo;
    private final FalleroeffnungNotizTagRepository notizTagRepo;

    private final FalleroeffnungErstmeldungRepository repo;
    private final FalleroeffnungErstmeldungAnlassRepository anlassRepo;
    private final FalleroeffnungErstmeldungObservationRepository obsRepo;
    private final FalleroeffnungErstmeldungObservationTagRepository obsTagRepo;
    private final FalleroeffnungErstmeldungContactRepository contactRepo;
    private final FalleroeffnungErstmeldungJugendamtRepository jugendamtRepo;
    private final FalleroeffnungErstmeldungExternRepository externRepo;
    private final FalleroeffnungErstmeldungAttachmentRepository attachmentRepo;

    private final UserRepository userRepo;
    private final AccessControlService access;
    private final FallRiskService riskService;

    public ErstmeldungService(
            FalleroeffnungRepository fallRepo,
            FalleroeffnungNotizRepository notizRepo,
            FalleroeffnungNotizTagRepository notizTagRepo,
            FalleroeffnungErstmeldungRepository repo,
            FalleroeffnungErstmeldungAnlassRepository anlassRepo,
            FalleroeffnungErstmeldungObservationRepository obsRepo,
            FalleroeffnungErstmeldungObservationTagRepository obsTagRepo,
            FalleroeffnungErstmeldungContactRepository contactRepo,
            FalleroeffnungErstmeldungJugendamtRepository jugendamtRepo,
            FalleroeffnungErstmeldungExternRepository externRepo,
            FalleroeffnungErstmeldungAttachmentRepository attachmentRepo,
            UserRepository userRepo,
            AccessControlService access,
            FallRiskService riskService
    ) {
        this.fallRepo = fallRepo;
        this.notizRepo = notizRepo;
        this.notizTagRepo = notizTagRepo;

        this.repo = repo;
        this.anlassRepo = anlassRepo;
        this.obsRepo = obsRepo;
        this.obsTagRepo = obsTagRepo;
        this.contactRepo = contactRepo;
        this.jugendamtRepo = jugendamtRepo;
        this.externRepo = externRepo;
        this.attachmentRepo = attachmentRepo;

        this.userRepo = userRepo;
        this.access = access;
        this.riskService = riskService;
    }

    // ---------------------------------------------------------
    // Read
    // ---------------------------------------------------------

    @Transactional(readOnly = true)
    public ErstmeldungResponse getCurrent(Long fallId) {
        Falleroeffnung fall = loadFallScoped(fallId);
        accessRead(fall);

        FalleroeffnungErstmeldung em = repo.findCurrentByFallId(fallId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "No current Erstmeldung"));

        return buildResponse(em);
    }

    @Transactional(readOnly = true)
    public ErstmeldungResponse getById(Long fallId, Long erstmeldungId) {
        Falleroeffnung fall = loadFallScoped(fallId);
        accessRead(fall);

        FalleroeffnungErstmeldung em = repo.findById(erstmeldungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Erstmeldung not found"));

        if (!em.getFalleroeffnung().getId().equals(fallId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Erstmeldung does not belong to fall");
        }

        return buildResponse(em);
    }

    @Transactional(readOnly = true)
    public List<ErstmeldungVersionListItemResponse> listVersions(Long fallId) {
        Falleroeffnung fall = loadFallScoped(fallId);
        accessRead(fall);

        return repo.findAllVersionsByFallId(fallId).stream()
                .map(e -> new ErstmeldungVersionListItemResponse(
                        e.getId(),
                        e.getVersionNo(),
                        e.isCurrent(),
                        e.getStatus(),
                        e.getErfasstAm(),
                        e.getSubmittedAt()
                ))
                .toList();
    }

    // ---------------------------------------------------------
    // Versioning
    // ---------------------------------------------------------

    @Transactional
    public ErstmeldungResponse createNewVersion(Long fallId) {
        Falleroeffnung fall = loadFallScoped(fallId);
        accessWrite(fall);

        Long userId = SecurityUtils.currentUserId();
        User creator = userRepo.findById(userId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        FalleroeffnungErstmeldung current = repo.findCurrentByFallId(fallId).orElse(null);

        Integer max = repo.findMaxVersionNo(fallId);
        int newNo = (max == null ? 1 : max + 1);

        if (current != null) {
            current.setCurrent(false);
            repo.save(current);
        }

        FalleroeffnungErstmeldung em = new FalleroeffnungErstmeldung();
        em.setFalleroeffnung(fall);
        em.setVersionNo(newNo);
        em.setCurrent(true);
        em.setStatus(ErstmeldungStatus.ENTWURF);
        em.setErfasstAm(Instant.now());
        em.setErfasstVon(creator);
        em.setErfasstVonRolle("UNBEKANNT");
        em.setMeldeweg(Meldeweg.EIGENBEOBACHTUNG);
        em.setDringlichkeit(Dringlichkeit.UNKLAR);
        em.setDatenbasis(Datenbasis.UNGEKLAERT);
        em.setKurzbeschreibung("");

        if (current != null) {
            em.setSupersedes(current);
        }

        FalleroeffnungErstmeldung saved = repo.save(em);
        return buildResponse(saved);
    }

    // ---------------------------------------------------------
    // Draft save (overwrite current draft fields)
    // ---------------------------------------------------------

    @Transactional
    public ErstmeldungResponse saveDraft(Long fallId, Long erstmeldungId, ErstmeldungDraftRequest req) {
        Falleroeffnung fall = loadFallScoped(fallId);
        accessWrite(fall);

        FalleroeffnungErstmeldung em = repo.findById(erstmeldungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Erstmeldung not found"));

        if (!em.getFalleroeffnung().getId().equals(fallId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Erstmeldung does not belong to fall");
        }

        if (em.getStatus() == ErstmeldungStatus.ABGESCHLOSSEN) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Erstmeldung is closed (immutable). Create a new version.");
        }

        // Main fields
        if (req.erfasstVonRolle() != null && !req.erfasstVonRolle().isBlank()) em.setErfasstVonRolle(req.erfasstVonRolle().trim());
        if (req.meldeweg() != null) em.setMeldeweg(req.meldeweg());
        em.setMeldewegSonstiges(req.meldewegSonstiges());
        em.setMeldendeStelleKontakt(req.meldendeStelleKontakt());
        if (req.dringlichkeit() != null) em.setDringlichkeit(req.dringlichkeit());
        if (req.datenbasis() != null) em.setDatenbasis(req.datenbasis());
        em.setEinwilligungVorhanden(req.einwilligungVorhanden());
        em.setSchweigepflichtentbindungVorhanden(req.schweigepflichtentbindungVorhanden());
        if (req.kurzbeschreibung() != null) em.setKurzbeschreibung(req.kurzbeschreibung());

        em.setFachAmpel(req.fachAmpel());
        em.setFachText(req.fachText());
        em.setAbweichungZurAuto(req.abweichungZurAuto());
        em.setAbweichungsBegruendung(req.abweichungsBegruendung());

        em.setAkutGefahrImVerzug(req.akutGefahrImVerzug());
        em.setAkutBegruendung(req.akutBegruendung());
        em.setAkutNotrufErforderlich(req.akutNotrufErforderlich());
        em.setAkutKindSicherUntergebracht(req.akutKindSicherUntergebracht());

        if (req.verantwortlicheFachkraftUserId() != null) {
            User u = userRepo.findById(req.verantwortlicheFachkraftUserId())
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "responsible user not found"));
            em.setVerantwortlicheFachkraft(u);
        } else {
            em.setVerantwortlicheFachkraft(null);
        }
        em.setNaechsteUeberpruefungAm(req.naechsteUeberpruefungAm());
        em.setZusammenfassung(req.zusammenfassung());

        // Replace child data atomically (simple, predictable)
        anlassRepo.deleteAllByErstmeldung_Id(em.getId());
        obsTagRepo.deleteAllByObservation_Erstmeldung_Id(em.getId());
        obsRepo.deleteAllByErstmeldung_Id(em.getId());
        contactRepo.deleteAllByErstmeldung_Id(em.getId());
        externRepo.deleteAllByErstmeldung_Id(em.getId());
        attachmentRepo.deleteAllByErstmeldung_Id(em.getId());
        jugendamtRepo.deleteById(em.getId());

        // Anlässe
        if (req.anlassCodes() != null) {
            for (String c0 : req.anlassCodes()) {
                if (c0 == null || c0.isBlank()) continue;
                String c = c0.trim();
                if (!AnlassCatalog.isAllowed(c)) {
                    throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown Anlass code: " + c);
                }
                FalleroeffnungErstmeldungAnlass a = new FalleroeffnungErstmeldungAnlass();
                a.setErstmeldung(em);
                a.setCode(c);
                anlassRepo.save(a);
            }
        }

        // Observations + tags
        if (req.observations() != null) {
            for (ErstmeldungDraftRequest.ObservationDraft od : req.observations()) {
                if (od == null) continue;
                if (od.text() == null || od.text().isBlank()) continue;

                FalleroeffnungErstmeldungObservation o = new FalleroeffnungErstmeldungObservation();
                o.setErstmeldung(em);
                o.setZeitpunkt(od.zeitpunkt());
                o.setZeitraum(od.zeitraum());
                o.setOrt(od.ort());
                o.setOrtSonstiges(od.ortSonstiges());
                o.setQuelle(od.quelle() != null ? od.quelle() : ObservationQuelle.SONSTIGE);
                o.setText(od.text().trim());
                o.setWoertlichesZitat(od.woertlichesZitat());
                o.setKoerperbefund(od.koerperbefund());
                o.setVerhaltenKind(od.verhaltenKind());
                o.setVerhaltenBezug(od.verhaltenBezug());
                o.setSichtbarkeit(od.sichtbarkeit() != null ? od.sichtbarkeit() : Sichtbarkeit.INTERN);

                FalleroeffnungErstmeldungObservation savedObs = obsRepo.save(o);

                if (od.tags() != null) {
                    for (ErstmeldungDraftRequest.ObservationTagDraft td : od.tags()) {
                        if (td == null) continue;

                        FalleroeffnungErstmeldungObservationTag t = new FalleroeffnungErstmeldungObservationTag();
                        t.setObservation(savedObs);

                        if (td.anlassCode() != null && !td.anlassCode().isBlank()) {
                            String ac = td.anlassCode().trim();
                            if (!AnlassCatalog.isAllowed(ac)) {
                                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown Anlass code: " + ac);
                            }
                            t.setAnlassCode(ac);
                        }

                        if (td.indicatorId() != null && !td.indicatorId().isBlank()) {
                            t.setIndicatorId(td.indicatorId().trim());
                            Integer sev = td.severity();
                            int s = sev == null ? 0 : Math.max(0, Math.min(3, sev));
                            t.setSeverity(s);
                        }

                        t.setComment(td.comment());
                        obsTagRepo.save(t);
                    }
                }
            }
        }

        // Jugendamt
        if (req.jugendamt() != null && req.jugendamt().informiert() != null) {
            FalleroeffnungErstmeldungJugendamt j = new FalleroeffnungErstmeldungJugendamt();
            j.setErstmeldung(em);
            j.setInformiert(req.jugendamt().informiert());
            j.setKontaktAm(req.jugendamt().kontaktAm());
            j.setKontaktart(req.jugendamt().kontaktart());
            j.setAktenzeichen(req.jugendamt().aktenzeichen());
            j.setBegruendung(req.jugendamt().begruendung());
            jugendamtRepo.save(j);
        }

        // Contacts
        if (req.contacts() != null) {
            for (ErstmeldungDraftRequest.ContactDraft cd : req.contacts()) {
                if (cd == null) continue;
                if (cd.kontaktMit() == null || cd.status() == null) continue;

                FalleroeffnungErstmeldungContact c = new FalleroeffnungErstmeldungContact();
                c.setErstmeldung(em);
                c.setKontaktMit(cd.kontaktMit());
                c.setKontaktAm(cd.kontaktAm());
                c.setStatus(cd.status());
                c.setNotiz(cd.notiz());
                c.setErgebnis(cd.ergebnis());
                contactRepo.save(c);
            }
        }

        // Extern
        if (req.extern() != null) {
            for (ErstmeldungDraftRequest.ExternDraft ed : req.extern()) {
                if (ed == null || ed.stelle() == null) continue;
                FalleroeffnungErstmeldungExtern ex = new FalleroeffnungErstmeldungExtern();
                ex.setErstmeldung(em);
                ex.setStelle(ed.stelle());
                ex.setStelleSonstiges(ed.stelleSonstiges());
                ex.setAm(ed.am());
                ex.setBegruendung(ed.begruendung());
                ex.setErgebnis(ed.ergebnis());
                externRepo.save(ex);
            }
        }

        // Attachments
        if (req.attachments() != null) {
            for (ErstmeldungDraftRequest.AttachmentDraft ad : req.attachments()) {
                if (ad == null || ad.fileId() == null || ad.typ() == null || ad.sichtbarkeit() == null) continue;

                FalleroeffnungErstmeldungAttachment a = new FalleroeffnungErstmeldungAttachment();
                a.setErstmeldung(em);
                a.setFileId(ad.fileId());
                a.setTyp(ad.typ());
                a.setTitel(ad.titel());
                a.setBeschreibung(ad.beschreibung());
                a.setSichtbarkeit(ad.sichtbarkeit());
                a.setRechtsgrundlageHinweis(ad.rechtsgrundlageHinweis());
                attachmentRepo.save(a);
            }
        }

        // Status optional im Draft steuern
        if (em.getStatus() == ErstmeldungStatus.ENTWURF && (req.kurzbeschreibung() != null && !req.kurzbeschreibung().isBlank())) {
            em.setStatus(ErstmeldungStatus.IN_BEARBEITUNG);
        }

        FalleroeffnungErstmeldung saved = repo.save(em);
        return buildResponse(saved);
    }

    // ---------------------------------------------------------
    // Submit (immutable afterwards)
    // ---------------------------------------------------------

    @Transactional
    public ErstmeldungResponse submit(Long fallId, Long erstmeldungId, ErstmeldungSubmitRequest req) {
        Falleroeffnung fall = loadFallScoped(fallId);
        accessWrite(fall);

        FalleroeffnungErstmeldung em = repo.findById(erstmeldungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Erstmeldung not found"));

        if (!em.getFalleroeffnung().getId().equals(fallId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Erstmeldung does not belong to fall");
        }

        if (em.getStatus() == ErstmeldungStatus.ABGESCHLOSSEN) {
            return buildResponse(em);
        }

        validateForSubmit(em);

        User u = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        em.setStatus(ErstmeldungStatus.ABGESCHLOSSEN);
        em.setSubmittedAt(Instant.now());
        em.setSubmittedBy(u);

        repo.save(em);

        if (req != null && req.mirrorObservationsToNotizen()) {
            mirrorObservationsToNotizen(em);
        }

        if (req != null && req.recomputeRisk()) {
            try {
                riskService.recomputeAndSnapshot(fallId);
            } catch (Exception ignored) {}
        }

        return buildResponse(em);
    }

    // ---------------------------------------------------------
    // Internals
    // ---------------------------------------------------------

    private Falleroeffnung loadFallScoped(Long fallId) {
        Long tid = SecurityUtils.currentTraegerIdRequired();
        Long oid = SecurityUtils.currentOrgUnitIdRequired();

        // Falls eure Repo-Methode anders heißt, hier anpassen.
        return fallRepo.findByIdWithRefsScoped(fallId, tid, oid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Falleröffnung not found"));
    }

    private void accessRead(Falleroeffnung fall) {
        access.requireAccessToEinrichtungObject(
                fall.getTraeger().getId(),
                fall.getEinrichtungOrgUnit().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );
    }

    private void accessWrite(Falleroeffnung fall) {
        access.requireAccessToEinrichtungObject(
                fall.getTraeger().getId(),
                fall.getEinrichtungOrgUnit().getId(),
                Role.SCHREIBEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );
    }

    private void validateForSubmit(FalleroeffnungErstmeldung em) {
        if (em.getKurzbeschreibung() == null || em.getKurzbeschreibung().isBlank()) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "kurzbeschreibung is required");
        }
        if (em.getFachAmpel() == null) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "fachAmpel is required for submit");
        }
        if (em.getFachText() == null || em.getFachText().isBlank()) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "fachText is required for submit");
        }

        // Jugendamt decision required
        FalleroeffnungErstmeldungJugendamt j = jugendamtRepo.findById(em.getId()).orElse(null);
        if (j == null || j.getInformiert() == null) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "jugendamt.informiert is required for submit");
        }
        if (j.getInformiert() != JugendamtInformiert.JA) {
            if (j.getBegruendung() == null || j.getBegruendung().isBlank()) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "jugendamt.begruendung required when not informed");
            }
        }

        // at least one observation
        List<FalleroeffnungErstmeldungObservation> obs = obsRepo.findAllByErstmeldungId(em.getId());
        if (obs.isEmpty()) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "At least one observation is required");
        }
    }

    private void mirrorObservationsToNotizen(FalleroeffnungErstmeldung em) {
        List<FalleroeffnungErstmeldungObservation> obs = obsRepo.findAllByErstmeldungId(em.getId());
        for (FalleroeffnungErstmeldungObservation o : obs) {
            if (o.getLinkedNotiz() != null) continue;

            FalleroeffnungNotiz n = new FalleroeffnungNotiz();
            n.setFalleroeffnung(em.getFalleroeffnung());
            n.setCreatedBy(em.getErfasstVon());
            n.setTyp("ERSTMELDUNG_OBSERVATION");
            n.setText(o.getText());
            n.setVisibility(
                    "WEITERGABEHINWEIS".equals(o.getSichtbarkeit().name())
                            ? org.thomcgn.backend.falloeffnungen.model.NoteVisibility.SHAREABLE
                            : org.thomcgn.backend.falloeffnungen.model.NoteVisibility.INTERN
            );

            FalleroeffnungNotiz savedNotiz = notizRepo.save(n);
            o.setLinkedNotiz(savedNotiz);
            obsRepo.save(o);

            // copy tags → falloeffnung_notiz_tags
            List<FalleroeffnungErstmeldungObservationTag> tags = obsTagRepo.findAllByObservationId(o.getId());
            for (FalleroeffnungErstmeldungObservationTag t : tags) {
                if ((t.getAnlassCode() == null || t.getAnlassCode().isBlank())
                        && (t.getIndicatorId() == null || t.getIndicatorId().isBlank())) {
                    continue;
                }

                FalleroeffnungNotizTag nt = new FalleroeffnungNotizTag();
                nt.setNotiz(savedNotiz);
                nt.setAnlassCode(t.getAnlassCode());
                nt.setIndicatorId(t.getIndicatorId());
                nt.setSeverity(t.getSeverity());
                notizTagRepo.save(nt);
            }
        }
    }

    private ErstmeldungResponse buildResponse(FalleroeffnungErstmeldung em) {
        List<String> anlaesse = anlassRepo.findCodes(em.getId());
        FalleroeffnungErstmeldungJugendamt j = jugendamtRepo.findById(em.getId()).orElse(null);
        List<FalleroeffnungErstmeldungContact> contacts = contactRepo.findAllByErstmeldungId(em.getId());
        List<FalleroeffnungErstmeldungExtern> extern = externRepo.findAllByErstmeldungId(em.getId());
        List<FalleroeffnungErstmeldungAttachment> attachments = attachmentRepo.findAllByErstmeldungId(em.getId());
        List<FalleroeffnungErstmeldungObservation> observations = obsRepo.findAllByErstmeldungId(em.getId());

        List<ErstmeldungResponse.ObservationResponse> obsResp = new ArrayList<>();
        for (FalleroeffnungErstmeldungObservation o : observations) {
            List<FalleroeffnungErstmeldungObservationTag> tags = obsTagRepo.findAllByObservationId(o.getId());
            List<ErstmeldungResponse.ObservationTagResponse> tagResp = tags.stream()
                    .map(t -> new ErstmeldungResponse.ObservationTagResponse(
                            t.getId(),
                            t.getAnlassCode(),
                            t.getIndicatorId(),
                            t.getSeverity(),
                            t.getComment()
                    ))
                    .toList();

            obsResp.add(new ErstmeldungResponse.ObservationResponse(
                    o.getId(),
                    o.getZeitpunkt(),
                    o.getZeitraum(),
                    o.getOrt(),
                    o.getOrtSonstiges(),
                    o.getQuelle(),
                    o.getText(),
                    o.getWoertlichesZitat(),
                    o.getKoerperbefund(),
                    o.getVerhaltenKind(),
                    o.getVerhaltenBezug(),
                    o.getSichtbarkeit(),
                    o.getLinkedNotiz() != null ? o.getLinkedNotiz().getId() : null,
                    tagResp
            ));
        }

        return new ErstmeldungResponse(
                em.getId(),
                em.getFalleroeffnung().getId(),
                em.getVersionNo(),
                em.isCurrent(),
                em.getSupersedes() != null ? em.getSupersedes().getId() : null,
                em.getStatus(),

                em.getErfasstAm(),
                em.getErfasstVon().getDisplayName(),
                em.getErfasstVonRolle(),

                em.getMeldeweg(),
                em.getMeldewegSonstiges(),
                em.getMeldendeStelleKontakt(),
                em.getDringlichkeit(),
                em.getDatenbasis(),
                em.getEinwilligungVorhanden(),
                em.getSchweigepflichtentbindungVorhanden(),

                em.getKurzbeschreibung(),

                em.getFachAmpel(),
                em.getFachText(),
                em.getAbweichungZurAuto(),
                em.getAbweichungsBegruendung(),

                em.isAkutGefahrImVerzug(),
                em.getAkutBegruendung(),
                em.getAkutNotrufErforderlich(),
                em.getAkutKindSicherUntergebracht(),

                em.getAutoRiskSnapshot() != null ? em.getAutoRiskSnapshot().getId() : null,

                em.getSubmittedAt(),
                em.getSubmittedBy() != null ? em.getSubmittedBy().getDisplayName() : null,

                em.getFreigabeAm(),
                em.getFreigabeVon() != null ? em.getFreigabeVon().getDisplayName() : null,
                em.getVerantwortlicheFachkraft() != null ? em.getVerantwortlicheFachkraft().getId() : null,
                em.getNaechsteUeberpruefungAm(),
                em.getZusammenfassung(),

                anlaesse,
                j != null ? new ErstmeldungResponse.JugendamtResponse(
                        j.getInformiert(),
                        j.getKontaktAm(),
                        j.getKontaktart(),
                        j.getAktenzeichen(),
                        j.getBegruendung()
                ) : null,
                contacts.stream().map(c -> new ErstmeldungResponse.ContactResponse(
                        c.getId(),
                        c.getKontaktMit(),
                        c.getKontaktAm(),
                        c.getStatus(),
                        c.getNotiz(),
                        c.getErgebnis()
                )).toList(),
                extern.stream().map(x -> new ErstmeldungResponse.ExternResponse(
                        x.getId(),
                        x.getStelle(),
                        x.getStelleSonstiges(),
                        x.getAm(),
                        x.getBegruendung(),
                        x.getErgebnis()
                )).toList(),
                attachments.stream().map(a -> new ErstmeldungResponse.AttachmentResponse(
                        a.getId(),
                        a.getFileId(),
                        a.getTyp(),
                        a.getTitel(),
                        a.getBeschreibung(),
                        a.getSichtbarkeit(),
                        a.getRechtsgrundlageHinweis()
                )).toList(),
                obsResp
        );
    }
}