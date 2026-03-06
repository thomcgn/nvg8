package org.thomcgn.backend.falloeffnungen.meldung.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.falloeffnungen.meldung.dto.*;
import org.thomcgn.backend.falloeffnungen.meldung.model.*;
import org.thomcgn.backend.falloeffnungen.meldung.repo.*;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.model.FalleroeffnungNotiz;
import org.thomcgn.backend.falloeffnungen.model.NoteVisibility;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungNotizRepository;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MeldungService {

    private final FalleroeffnungRepository fallRepo;
    private final MeldungRepository meldungRepo;
    private final MeldungObservationRepository obsRepo;
    private final MeldungObservationTagRepository obsTagRepo;
    private final MeldungAnlassCodeRepository anlassRepo;
    private final MeldungJugendamtRepository jugendamtRepo;
    private final MeldungContactRepository contactRepo;
    private final MeldungExternRepository externRepo;
    private final MeldungAttachmentRepository attachmentRepo;
    private final MeldungChangeRepository changeRepo;
    private final FalleroeffnungNotizRepository notizRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;

    @PersistenceContext
    private EntityManager em;

    public MeldungService(
            FalleroeffnungRepository fallRepo,
            MeldungRepository meldungRepo,
            MeldungObservationRepository obsRepo,
            MeldungObservationTagRepository obsTagRepo,
            MeldungAnlassCodeRepository anlassRepo,
            MeldungJugendamtRepository jugendamtRepo,
            MeldungContactRepository contactRepo,
            MeldungExternRepository externRepo,
            MeldungAttachmentRepository attachmentRepo,
            MeldungChangeRepository changeRepo,
            FalleroeffnungNotizRepository notizRepo,
            UserRepository userRepo,
            AccessControlService access
    ) {
        this.fallRepo = fallRepo;
        this.meldungRepo = meldungRepo;
        this.obsRepo = obsRepo;
        this.obsTagRepo = obsTagRepo;
        this.anlassRepo = anlassRepo;
        this.jugendamtRepo = jugendamtRepo;
        this.contactRepo = contactRepo;
        this.externRepo = externRepo;
        this.attachmentRepo = attachmentRepo;
        this.changeRepo = changeRepo;
        this.notizRepo = notizRepo;
        this.userRepo = userRepo;
        this.access = access;
    }

    // =====================================================
    // READ
    // =====================================================

    @Transactional(readOnly = true)
    public List<MeldungListItemResponse> list(Long fallId) {
        Falleroeffnung fall = loadFallScoped(fallId);
        accessRead(fall);

        return meldungRepo.listByFall(fall.getId()).stream()
                .map(m -> new MeldungListItemResponse(
                        m.getId(),
                        m.getVersionNo(),
                        m.isCurrent(),
                        m.getStatus().name(),
                        m.getType().name(),
                        m.getCreatedAt(),
                        m.getCreatedByDisplayName(),
                        m.getSupersedes() == null ? null : m.getSupersedes().getId(),
                        m.getCorrects() == null ? null : m.getCorrects().getId()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public MeldungResponse current(Long fallId) {
        Falleroeffnung fall = loadFallScoped(fallId);
        accessRead(fall);

        Meldung m = meldungRepo.findCurrentByFallId(fall.getId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "No current Meldung"));

        return buildResponse(m, true);
    }

    @Transactional(readOnly = true)
    public MeldungResponse get(Long fallId, Long meldungId) {
        Falleroeffnung fall = loadFallScoped(fallId);
        accessRead(fall);

        Meldung m = meldungRepo.findById(meldungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Meldung not found"));

        if (!Objects.equals(m.getFalleroeffnung().getId(), fall.getId())) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Meldung does not belong to this Fall");
        }

        return buildResponse(m, true);
    }

    // =====================================================
    // CREATE / VERSIONING
    // =====================================================

    @Transactional
    public MeldungResponse createNew(Long fallId, MeldungCreateRequest req) {
        Falleroeffnung fall = loadFallScoped(fallId);
        accessWrite(fall);

        User user = currentUser();

        try {
            fallRepo.lockById(fall.getId())
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fall not found"));

            Optional<Meldung> currentOpt = meldungRepo.findCurrentByFallIdForUpdate(fall.getId());

            if (currentOpt.isPresent()) {
                Meldung current = currentOpt.get();

                if (req == null || req.supersedesId() == null) {
                    throw DomainException.conflict(ErrorCode.CONFLICT, "Current Meldung exists; update draft instead");
                }

                if (!Objects.equals(req.supersedesId(), current.getId())) {
                    throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "supersedesId must reference the current Meldung");
                }

                current.setCurrent(false);

                int nextVersion = meldungRepo.getMaxVersionNo(fall.getId()) + 1;

                Meldung m = new Meldung();
                m.setFalleroeffnung(fall);
                m.setVersionNo(nextVersion);
                m.setCurrent(true);
                m.setStatus(MeldungStatus.ENTWURF);
                m.setType(MeldungType.MELDUNG);
                m.setSupersedes(current);
                m.setCreatedBy(user);
                m.setCreatedByDisplayName(user.getDisplayName());

                Meldung saved = meldungRepo.saveAndFlush(m);
                return buildResponse(saved, true);
            }

            Meldung m = new Meldung();
            m.setFalleroeffnung(fall);
            m.setVersionNo(1);
            m.setCurrent(true);
            m.setStatus(MeldungStatus.ENTWURF);
            m.setType(MeldungType.ERSTMELDUNG);
            m.setCreatedBy(user);
            m.setCreatedByDisplayName(user.getDisplayName());

            Meldung saved = meldungRepo.saveAndFlush(m);
            return buildResponse(saved, true);

        } catch (DataIntegrityViolationException ex) {
            em.clear();
            throw DomainException.conflict(ErrorCode.CONFLICT, "Could not create Meldung (constraint conflict)");
        }
    }

    @Transactional
    public MeldungResponse startCorrection(Long fallId, MeldungCorrectRequest req) {
        Falleroeffnung fall = loadFallScoped(fallId);
        accessWrite(fall);

        if (req == null || req.targetMeldungId() == null) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "targetMeldungId missing");
        }

        Meldung target = meldungRepo.findById(req.targetMeldungId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Target not found"));

        if (!Objects.equals(target.getFalleroeffnung().getId(), fall.getId())) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Target does not belong to this Fall");
        }

        if (target.getStatus() != MeldungStatus.ABGESCHLOSSEN) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "Target is not abgeschlossen");
        }

        User user = currentUser();

        try {
            fallRepo.lockById(fall.getId())
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fall not found"));

            Optional<Meldung> existingDraft = meldungRepo
                    .findFirstByFalleroeffnung_IdAndTypeAndStatusAndCorrects_Id(
                            fall.getId(),
                            MeldungType.KORREKTUR,
                            MeldungStatus.ENTWURF,
                            target.getId()
                    );

            if (existingDraft.isPresent()) {
                return buildResponse(existingDraft.get(), true);
            }

            int nextVersion = meldungRepo.getMaxVersionNo(fall.getId()) + 1;

            Meldung korr = new Meldung();
            korr.setFalleroeffnung(fall);
            korr.setVersionNo(nextVersion);
            korr.setCurrent(false);
            korr.setStatus(MeldungStatus.ENTWURF);
            korr.setType(MeldungType.KORREKTUR);
            korr.setCorrects(target);
            korr.setSupersedes(null);
            korr.setCreatedBy(user);
            korr.setCreatedByDisplayName(user.getDisplayName());

            copyContentFrom(target, korr);

            if (req.changeReason() != null) korr.setChangeReason(req.changeReason());
            if (req.infoEffectiveAt() != null) korr.setInfoEffectiveAt(req.infoEffectiveAt());
            if (req.reasonText() != null) korr.setReasonText(req.reasonText());

            Meldung saved = meldungRepo.saveAndFlush(korr);

            copySectionsFrom(target, saved);

            return buildResponse(saved, true);

        } catch (DataIntegrityViolationException ex) {
            em.clear();
            throw DomainException.conflict(ErrorCode.CONFLICT, "Could not create correction (constraint conflict)");
        }
    }

    // =====================================================
    // DRAFT
    // =====================================================

    @Transactional
    public MeldungResponse saveDraft(Long fallId, Long meldungId, MeldungDraftRequest req) {
        Falleroeffnung fall = loadFallScoped(fallId);
        accessWrite(fall);

        Meldung m = meldungRepo.findById(meldungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Meldung not found"));

        if (!Objects.equals(m.getFalleroeffnung().getId(), fall.getId())) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Meldung does not belong to this Fall");
        }

        if (m.getStatus() == MeldungStatus.ABGESCHLOSSEN) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "Meldung is abgeschlossen (immutable)");
        }

        applyDraftToEntity(m, req);
        meldungRepo.save(m);

        upsertAnlassCodes(m, req == null ? null : req.anlassCodes());
        upsertJugendamt(m, req == null ? null : req.jugendamt());
        upsertContacts(m, req == null ? null : req.contacts());
        upsertExtern(m, req == null ? null : req.extern());
        upsertAttachments(m, req == null ? null : req.attachments());
        upsertObservationsAndTags(m, req == null ? null : req.observations());

        if (req != null && req.sectionReasons() != null && !req.sectionReasons().isEmpty()) {
            writeSectionReasons(m, req.sectionReasons());
        }

        return buildResponse(m, true);
    }

    // =====================================================
    // SUBMIT
    // =====================================================

    @Transactional
    public MeldungResponse submit(Long fallId, Long meldungId, MeldungSubmitRequest req) {
        Falleroeffnung fall = loadFallScoped(fallId);
        accessWrite(fall);

        Meldung m = meldungRepo.findById(meldungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Meldung not found"));

        if (!Objects.equals(m.getFalleroeffnung().getId(), fall.getId())) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Meldung does not belong to this Fall");
        }

        if (m.getStatus() == MeldungStatus.ABGESCHLOSSEN) {
            return buildResponse(m, true);
        }

        boolean isCorrection = (m.getType() == MeldungType.KORREKTUR) || (m.getCorrects() != null);

        if (isCorrection) {
            String reason = req == null ? null : req.changeReason();
            if (reason == null || reason.isBlank()) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "changeReason missing");
            }
            writeSectionReasons(m, Map.of("KORREKTURGRUND", reason.trim()));
        }

        if (m.getChangeReason() != null && requiresInfoEffectiveAt(m.getChangeReason()) && m.getInfoEffectiveAt() == null) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "infoEffectiveAt missing");
        }

        User user = currentUser();

        m.setStatus(MeldungStatus.ABGESCHLOSSEN);
        m.setSubmittedAt(Instant.now());
        m.setSubmittedBy(user);
        m.setSubmittedByDisplayName(user.getDisplayName());

        meldungRepo.save(m);

        if (req != null && req.sectionReasons() != null && !req.sectionReasons().isEmpty()) {
            writeSectionReasons(m, req.sectionReasons());
        }

        boolean mirror = req != null && Boolean.TRUE.equals(req.mirrorToNotizen());
        if (mirror) {
            mirrorToNotizen(m);
        }

        return buildResponse(m, true);
    }

    private boolean requiresInfoEffectiveAt(MeldungChangeReason reason) {
        return reason == MeldungChangeReason.NACHTRAG
                || reason == MeldungChangeReason.UPDATE
                || reason == MeldungChangeReason.REASSESSMENT;
    }

    // =====================================================
    // INTERNALS
    // =====================================================

    private void copyContentFrom(Meldung from, Meldung to) {
        to.setErfasstVonRolle(from.getErfasstVonRolle());
        to.setMeldeweg(from.getMeldeweg());
        to.setMeldewegSonstiges(from.getMeldewegSonstiges());
        to.setMeldendeStelleKontakt(from.getMeldendeStelleKontakt());

        to.setDringlichkeit(from.getDringlichkeit());
        to.setDatenbasis(from.getDatenbasis());

        to.setEinwilligungVorhanden(from.getEinwilligungVorhanden());
        to.setSchweigepflichtentbindungVorhanden(from.getSchweigepflichtentbindungVorhanden());

        to.setKurzbeschreibung(from.getKurzbeschreibung());

        to.setFachAmpel(from.getFachAmpel());
        to.setFachText(from.getFachText());
        to.setAbweichungZurAuto(from.getAbweichungZurAuto());
        to.setAbweichungsBegruendung(from.getAbweichungsBegruendung());

        to.setAkutGefahrImVerzug(from.isAkutGefahrImVerzug());
        to.setAkutBegruendung(from.getAkutBegruendung());
        to.setAkutNotrufErforderlich(from.getAkutNotrufErforderlich());
        to.setAkutKindSicherUntergebracht(from.getAkutKindSicherUntergebracht());

        to.setVerantwortlicheFachkraft(from.getVerantwortlicheFachkraft());
        to.setNaechsteUeberpruefungAm(from.getNaechsteUeberpruefungAm());
        to.setZusammenfassung(from.getZusammenfassung());

        to.setAutoRiskSnapshot(from.getAutoRiskSnapshot());
    }

    private void copySectionsFrom(Meldung from, Meldung to) {
        List<String> codes = anlassRepo.findAllByMeldungId(from.getId()).stream()
                .map(MeldungAnlassCode::getCode)
                .toList();
        upsertAnlassCodes(to, codes);

        jugendamtRepo.findByMeldungId(from.getId()).ifPresent(j -> {
            MeldungJugendamt ja = new MeldungJugendamt();
            ja.setMeldung(to);
            ja.setInformiert(j.getInformiert());
            ja.setKontaktAm(j.getKontaktAm());
            ja.setKontaktart(j.getKontaktart());
            ja.setAktenzeichen(j.getAktenzeichen());
            ja.setBegruendung(j.getBegruendung());
            jugendamtRepo.save(ja);
        });

        List<MeldungDraftRequest.ContactDraft> contacts = contactRepo.findAllByMeldungId(from.getId()).stream()
                .map(c -> new MeldungDraftRequest.ContactDraft(
                        c.getKontaktMit(),
                        c.getKontaktAm(),
                        c.getStatus(),
                        c.getNotiz(),
                        c.getErgebnis()
                ))
                .toList();
        upsertContacts(to, contacts);

        List<MeldungDraftRequest.ExternDraft> extern = externRepo.findAllByMeldungId(from.getId()).stream()
                .map(e -> new MeldungDraftRequest.ExternDraft(
                        e.getStelle(),
                        e.getStelleSonstiges(),
                        e.getAm(),
                        e.getBegruendung(),
                        e.getErgebnis()
                ))
                .toList();
        upsertExtern(to, extern);

        List<MeldungDraftRequest.AttachmentDraft> attachments = attachmentRepo.findAllByMeldungId(from.getId()).stream()
                .map(a -> new MeldungDraftRequest.AttachmentDraft(
                        a.getFileId(),
                        a.getTyp(),
                        a.getTitel(),
                        a.getBeschreibung(),
                        a.getSichtbarkeit(),
                        a.getRechtsgrundlageHinweis()
                ))
                .toList();
        upsertAttachments(to, attachments);

        List<MeldungObservation> obs = obsRepo.findAllByMeldungId(from.getId());
        obsRepo.deleteAllByMeldungId(to.getId());

        for (MeldungObservation o : obs) {
            MeldungObservation n = new MeldungObservation();
            n.setMeldung(to);
            n.setZeitpunkt(o.getZeitpunkt());
            n.setZeitraum(o.getZeitraum());
            n.setOrt(o.getOrt());
            n.setOrtSonstiges(o.getOrtSonstiges());
            n.setQuelle(o.getQuelle());
            n.setText(o.getText());
            n.setWoertlichesZitat(o.getWoertlichesZitat());
            n.setKoerperbefund(o.getKoerperbefund());
            n.setVerhaltenKind(o.getVerhaltenKind());
            n.setVerhaltenBezug(o.getVerhaltenBezug());
            n.setSichtbarkeit(o.getSichtbarkeit());
            n.setCreatedByDisplayName(to.getCreatedByDisplayName());

            MeldungObservation savedObs = obsRepo.save(n);

            List<MeldungObservationTag> tags = obsTagRepo.findAllByObservationIds(List.of(o.getId()));
            for (MeldungObservationTag t : tags) {
                MeldungObservationTag nt = new MeldungObservationTag();
                nt.setObservation(savedObs);
                nt.setAnlassCode(t.getAnlassCode());
                nt.setIndicatorId(t.getIndicatorId());
                nt.setSeverity(t.getSeverity());
                nt.setComment(t.getComment());
                obsTagRepo.save(nt);
            }
        }
    }

    private void applyDraftToEntity(Meldung m, MeldungDraftRequest req) {
        if (req == null) return;

        m.setChangeReason(req.changeReason());
        m.setInfoEffectiveAt(req.infoEffectiveAt());
        m.setReasonText(req.reasonText());

        m.setErfasstVonRolle(req.erfasstVonRolle());
        m.setMeldeweg(req.meldeweg());
        m.setMeldewegSonstiges(req.meldewegSonstiges());
        m.setMeldendeStelleKontakt(req.meldendeStelleKontakt());
        m.setDringlichkeit(req.dringlichkeit());
        m.setDatenbasis(req.datenbasis());
        m.setEinwilligungVorhanden(req.einwilligungVorhanden());
        m.setSchweigepflichtentbindungVorhanden(req.schweigepflichtentbindungVorhanden());

        if (req.kurzbeschreibung() != null) m.setKurzbeschreibung(req.kurzbeschreibung());

        m.setFachAmpel(req.fachAmpel());
        m.setFachText(req.fachText());
        m.setAbweichungZurAuto(req.abweichungZurAuto());
        m.setAbweichungsBegruendung(req.abweichungsBegruendung());

        m.setAkutGefahrImVerzug(req.akutGefahrImVerzug());
        m.setAkutBegruendung(req.akutBegruendung());
        m.setAkutNotrufErforderlich(req.akutNotrufErforderlich());
        m.setAkutKindSicherUntergebracht(req.akutKindSicherUntergebracht());

        if (req.verantwortlicheFachkraftUserId() != null) {
            User vf = userRepo.findById(req.verantwortlicheFachkraftUserId())
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "verantwortlicheFachkraft not found"));
            m.setVerantwortlicheFachkraft(vf);
        } else {
            m.setVerantwortlicheFachkraft(null);
        }

        m.setNaechsteUeberpruefungAm(req.naechsteUeberpruefungAm());
        m.setZusammenfassung(req.zusammenfassung());
    }

    private void upsertAnlassCodes(Meldung m, List<String> codes) {
        anlassRepo.deleteAllByMeldungId(m.getId());
        if (codes == null || codes.isEmpty()) return;

        for (String c : codes) {
            if (c == null || c.isBlank()) continue;
            MeldungAnlassCode a = new MeldungAnlassCode();
            a.setMeldung(m);
            a.setCode(c.trim());
            anlassRepo.save(a);
        }
    }

    private void upsertJugendamt(Meldung m, MeldungDraftRequest.JugendamtDraft j) {
        jugendamtRepo.findByMeldungId(m.getId()).ifPresent(jugendamtRepo::delete);
        if (j == null) return;

        MeldungJugendamt ja = new MeldungJugendamt();
        ja.setMeldung(m);
        ja.setInformiert(j.informiert());
        ja.setKontaktAm(j.kontaktAm());
        ja.setKontaktart(j.kontaktart());
        ja.setAktenzeichen(j.aktenzeichen());
        ja.setBegruendung(j.begruendung());
        jugendamtRepo.save(ja);
    }

    private void upsertContacts(Meldung m, List<MeldungDraftRequest.ContactDraft> contacts) {
        contactRepo.deleteAllByMeldungId(m.getId());
        if (contacts == null || contacts.isEmpty()) return;

        for (var c : contacts) {
            if (c == null) continue;
            MeldungContact mc = new MeldungContact();
            mc.setMeldung(m);
            mc.setKontaktMit(c.kontaktMit());
            mc.setKontaktAm(c.kontaktAm());
            mc.setStatus(c.status());
            mc.setNotiz(c.notiz());
            mc.setErgebnis(c.ergebnis());
            contactRepo.save(mc);
        }
    }

    private void upsertExtern(Meldung m, List<MeldungDraftRequest.ExternDraft> extern) {
        externRepo.deleteAllByMeldungId(m.getId());
        if (extern == null || extern.isEmpty()) return;

        for (var e : extern) {
            if (e == null) continue;
            MeldungExtern me = new MeldungExtern();
            me.setMeldung(m);
            me.setStelle(e.stelle());
            me.setStelleSonstiges(e.stelleSonstiges());
            me.setAm(e.am());
            me.setBegruendung(e.begruendung());
            me.setErgebnis(e.ergebnis());
            externRepo.save(me);
        }
    }

    private void upsertAttachments(Meldung m, List<MeldungDraftRequest.AttachmentDraft> attachments) {
        attachmentRepo.deleteAllByMeldungId(m.getId());
        if (attachments == null || attachments.isEmpty()) return;

        for (var a : attachments) {
            if (a == null || a.fileId() == null) continue;
            MeldungAttachment ma = new MeldungAttachment();
            ma.setMeldung(m);
            ma.setFileId(a.fileId());
            ma.setTyp(a.typ());
            ma.setTitel(a.titel());
            ma.setBeschreibung(a.beschreibung());
            ma.setSichtbarkeit(a.sichtbarkeit());
            ma.setRechtsgrundlageHinweis(a.rechtsgrundlageHinweis());
            attachmentRepo.save(ma);
        }
    }

    private void upsertObservationsAndTags(Meldung m, List<MeldungDraftRequest.ObservationDraft> obs) {
        List<MeldungObservation> old = obsRepo.findAllByMeldungId(m.getId());
        List<Long> oldIds = old.stream().map(MeldungObservation::getId).filter(Objects::nonNull).toList();
        if (!oldIds.isEmpty()) {
            obsTagRepo.deleteAllByObservationIds(oldIds);
        }
        obsRepo.deleteAllByMeldungId(m.getId());

        if (obs == null || obs.isEmpty()) return;

        User user = currentUser();

        for (var o : obs) {
            if (o == null) continue;

            MeldungObservation mo = new MeldungObservation();
            mo.setMeldung(m);
            mo.setZeitpunkt(o.zeitpunkt());
            mo.setZeitraum(o.zeitraum());
            mo.setOrt(o.ort());
            mo.setOrtSonstiges(o.ortSonstiges());
            mo.setQuelle(o.quelle());
            mo.setText(o.text());
            mo.setWoertlichesZitat(o.woertlichesZitat());
            mo.setKoerperbefund(o.koerperbefund());
            mo.setVerhaltenKind(o.verhaltenKind());
            mo.setVerhaltenBezug(o.verhaltenBezug());
            mo.setSichtbarkeit(o.sichtbarkeit());

            mo.setCreatedAt(Instant.now());
            mo.setCreatedBy(user);
            mo.setCreatedByDisplayName(user.getDisplayName());

            obsRepo.save(mo);

            if (o.tags() != null && !o.tags().isEmpty()) {
                for (var t : o.tags()) {
                    if (t == null) continue;
                    MeldungObservationTag tag = new MeldungObservationTag();
                    tag.setObservation(mo);
                    tag.setAnlassCode(t.anlassCode());
                    tag.setIndicatorId(t.indicatorId());
                    tag.setSeverity(t.severity());
                    tag.setComment(t.comment());
                    obsTagRepo.save(tag);
                }
            }
        }
    }

    private void writeSectionReasons(Meldung m, Map<String, String> sectionReasons) {
        if (sectionReasons == null || sectionReasons.isEmpty()) return;

        User user = currentUser();

        for (var e : sectionReasons.entrySet()) {
            String key = e.getKey();
            String reason = e.getValue();

            if (key == null || key.isBlank()) continue;
            if (reason == null || reason.isBlank()) continue;

            MeldungChange ch = new MeldungChange();
            ch.setMeldung(m);
            ch.setSection(MeldungSection.valueOfSafe(key));
            ch.setFieldPath("sectionReason:" + key.trim());
            ch.setOldValue(null);
            ch.setNewValue(null);
            ch.setReason(reason.trim());
            ch.setChangedAt(Instant.now());
            ch.setChangedBy(user);
            ch.setChangedByDisplayName(user.getDisplayName());
            changeRepo.save(ch);
        }
    }

    private void mirrorToNotizen(Meldung m) {
        FalleroeffnungNotiz n = new FalleroeffnungNotiz();
        n.setFalleroeffnung(m.getFalleroeffnung());
        n.setCreatedBy(m.getSubmittedBy() != null ? m.getSubmittedBy() : m.getCreatedBy());
        n.setVisibility(NoteVisibility.INTERN);
        n.setTyp("MELDUNG_" + m.getType().name());

        String header =
                "Meldung (" + m.getType() + ") v" + m.getVersionNo() + "\n" +
                        "Dringlichkeit: " + (m.getDringlichkeit() == null ? "—" : m.getDringlichkeit().name()) + " | " +
                        "Meldeweg: " + (m.getMeldeweg() == null ? "—" : m.getMeldeweg().name()) + "\n\n";

        n.setText(header + (m.getKurzbeschreibung() == null ? "" : m.getKurzbeschreibung()));
        notizRepo.save(n);

        List<MeldungObservation> obs = obsRepo.findAllByMeldungId(m.getId());
        for (MeldungObservation o : obs) {
            FalleroeffnungNotiz on = new FalleroeffnungNotiz();
            on.setFalleroeffnung(m.getFalleroeffnung());
            on.setCreatedBy(o.getCreatedBy());
            on.setVisibility(NoteVisibility.INTERN);
            on.setTyp("MELDUNG_OBSERVATION");
            on.setText(o.getText());
            notizRepo.save(on);
        }
    }

    @Transactional(readOnly = true)
    protected MeldungResponse buildResponse(Meldung m, boolean includeChanges) {
        List<MeldungObservation> obs = obsRepo.findAllByMeldungId(m.getId());
        List<Long> obsIds = obs.stream().map(MeldungObservation::getId).filter(Objects::nonNull).toList();

        final Map<Long, List<MeldungObservationTag>> tagsByObs;
        if (obsIds.isEmpty()) {
            tagsByObs = Map.of();
        } else {
            tagsByObs = obsTagRepo.findAllByObservationIds(obsIds).stream()
                    .collect(Collectors.groupingBy(t -> t.getObservation().getId()));
        }

        List<MeldungResponse.ObservationResponse> obsResp = obs.stream().map(o -> new MeldungResponse.ObservationResponse(
                o.getId(),
                o.getZeitpunkt(),
                o.getZeitraum() == null ? null : o.getZeitraum().name(),
                o.getOrt() == null ? null : o.getOrt().name(),
                o.getOrtSonstiges(),
                o.getQuelle() == null ? null : o.getQuelle().name(),
                o.getText(),
                o.getWoertlichesZitat(),
                o.getKoerperbefund(),
                o.getVerhaltenKind(),
                o.getVerhaltenBezug(),
                o.getSichtbarkeit() == null ? null : o.getSichtbarkeit().name(),
                o.getCreatedAt(),
                o.getCreatedByDisplayName(),
                tagsByObs.getOrDefault(o.getId(), List.of()).stream().map(t -> new MeldungResponse.ObservationTagResponse(
                        t.getId(),
                        t.getAnlassCode(),
                        t.getIndicatorId(),
                        t.getSeverity(),
                        t.getComment()
                )).toList()
        )).toList();

        List<String> anlaesse = anlassRepo.findAllByMeldungId(m.getId()).stream()
                .map(MeldungAnlassCode::getCode)
                .toList();

        var jugendamtOpt = jugendamtRepo.findByMeldungId(m.getId());
        MeldungResponse.JugendamtResponse jaResp = jugendamtOpt.map(j -> new MeldungResponse.JugendamtResponse(
                j.getInformiert() == null ? null : j.getInformiert().name(),
                j.getKontaktAm(),
                j.getKontaktart() == null ? null : j.getKontaktart().name(),
                j.getAktenzeichen(),
                j.getBegruendung()
        )).orElse(null);

        List<MeldungResponse.ContactResponse> contacts = contactRepo.findAllByMeldungId(m.getId()).stream()
                .map(c -> new MeldungResponse.ContactResponse(
                        c.getId(),
                        c.getKontaktMit() == null ? null : c.getKontaktMit().name(),
                        c.getKontaktAm(),
                        c.getStatus() == null ? null : c.getStatus().name(),
                        c.getNotiz(),
                        c.getErgebnis()
                )).toList();

        List<MeldungResponse.ExternResponse> extern = externRepo.findAllByMeldungId(m.getId()).stream()
                .map(e -> new MeldungResponse.ExternResponse(
                        e.getId(),
                        e.getStelle() == null ? null : e.getStelle().name(),
                        e.getStelleSonstiges(),
                        e.getAm(),
                        e.getBegruendung(),
                        e.getErgebnis()
                )).toList();

        List<MeldungResponse.AttachmentResponse> attachments = attachmentRepo.findAllByMeldungId(m.getId()).stream()
                .map(a -> new MeldungResponse.AttachmentResponse(
                        a.getId(),
                        a.getFileId(),
                        a.getTyp() == null ? null : a.getTyp().name(),
                        a.getTitel(),
                        a.getBeschreibung(),
                        a.getSichtbarkeit() == null ? null : a.getSichtbarkeit().name(),
                        a.getRechtsgrundlageHinweis()
                )).toList();

        List<MeldungChangeResponse> changes = includeChanges
                ? changeRepo.findAllByMeldung_IdOrderByChangedAtAsc(m.getId()).stream()
                .map(c -> new MeldungChangeResponse(
                        c.getId(),
                        c.getSection().name(),
                        c.getFieldPath(),
                        c.getOldValue(),
                        c.getNewValue(),
                        c.getReason(),
                        c.getChangedAt(),
                        c.getChangedByDisplayName()
                )).toList()
                : List.of();

        return new MeldungResponse(
                m.getId(),
                m.getFalleroeffnung().getId(),
                m.getVersionNo(),
                m.isCurrent(),
                m.getStatus().name(),
                m.getType().name(),

                m.getCreatedAt(),
                m.getUpdatedAt(),
                m.getCreatedByDisplayName(),

                m.getSupersedes() == null ? null : m.getSupersedes().getId(),
                m.getCorrects() == null ? null : m.getCorrects().getId(),

                m.getChangeReason() == null ? null : m.getChangeReason().name(),
                m.getInfoEffectiveAt(),
                m.getReasonText(),

                m.getErfasstVonRolle(),
                m.getMeldeweg() == null ? null : m.getMeldeweg().name(),
                m.getMeldewegSonstiges(),
                m.getMeldendeStelleKontakt(),
                m.getDringlichkeit() == null ? null : m.getDringlichkeit().name(),
                m.getDatenbasis() == null ? null : m.getDatenbasis().name(),
                m.getEinwilligungVorhanden(),
                m.getSchweigepflichtentbindungVorhanden(),

                m.getKurzbeschreibung(),

                m.getFachAmpel() == null ? null : m.getFachAmpel().name(),
                m.getFachText(),
                m.getAbweichungZurAuto() == null ? null : m.getAbweichungZurAuto().name(),
                m.getAbweichungsBegruendung(),

                m.isAkutGefahrImVerzug(),
                m.getAkutBegruendung(),
                m.getAkutNotrufErforderlich(),
                m.getAkutKindSicherUntergebracht() == null ? null : m.getAkutKindSicherUntergebracht().name(),

                m.getVerantwortlicheFachkraft() == null ? null : m.getVerantwortlicheFachkraft().getId(),
                m.getNaechsteUeberpruefungAm(),
                m.getZusammenfassung(),

                anlaesse,
                jaResp,
                contacts,
                extern,
                attachments,

                obsResp,

                m.getSubmittedAt(),
                m.getSubmittedByDisplayName(),
                m.getFreigabeAm(),
                m.getFreigabeVon() == null ? null : m.getFreigabeVon().getDisplayName(),

                changes
        );
    }

    private Falleroeffnung loadFallScoped(Long fallId) {
        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        if (einrichtungId == null) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "No active Einrichtung in context");
        }

        return fallRepo.findByIdWithRefsScoped(fallId, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fall not found"));
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

    private User currentUser() {
        Long uid = SecurityUtils.currentUserId();
        return userRepo.findById(uid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));
    }
}