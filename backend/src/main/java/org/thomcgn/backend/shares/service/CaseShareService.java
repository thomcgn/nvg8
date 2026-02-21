package org.thomcgn.backend.shares.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.audit.model.AuditEventAction;
import org.thomcgn.backend.audit.service.AuditService;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.faelle.model.Fall;
import org.thomcgn.backend.faelle.repo.FallRepository;
import org.thomcgn.backend.shares.dto.*;
import org.thomcgn.backend.shares.model.*;
import org.thomcgn.backend.shares.repo.CaseShareRequestRepository;
import org.thomcgn.backend.shares.repo.CaseTransferPackageRepository;
import org.thomcgn.backend.shares.repo.ExternalPartnerRepository;
import org.thomcgn.backend.tenants.repo.TraegerRepository;
import org.thomcgn.backend.users.repo.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class CaseShareService {

    private final ExternalPartnerRepository partnerRepo;
    private final CaseShareRequestRepository requestRepo;
    private final CaseTransferPackageRepository packageRepo;

    private final FallRepository fallRepository;
    private final UserRepository userRepository;
    private final TraegerRepository traegerRepository;

    private final AccessControlService access;
    private final AuditService auditService;
    private final CaseTransferPackageBuilder builder;

    // MVP: base url config später in application.yml
    private final String externalBaseUrl = "https://external.example.com";

    public CaseShareService(
            ExternalPartnerRepository partnerRepo,
            CaseShareRequestRepository requestRepo,
            CaseTransferPackageRepository packageRepo,
            FallRepository fallRepository,
            UserRepository userRepository,
            TraegerRepository traegerRepository,
            AccessControlService access,
            AuditService auditService,
            CaseTransferPackageBuilder builder
    ) {
        this.partnerRepo = partnerRepo;
        this.requestRepo = requestRepo;
        this.packageRepo = packageRepo;
        this.fallRepository = fallRepository;
        this.userRepository = userRepository;
        this.traegerRepository = traegerRepository;
        this.access = access;
        this.auditService = auditService;
        this.builder = builder;
    }

    // -----------------------------
    // 1) Create Share Request (internal user)
    // -----------------------------
    @Transactional
    public CreateShareRequestResponse createRequest(CreateShareRequestRequest req) {
        // Rolle: mindestens lesen/fachlich (du kannst das strenger machen)
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        ExternalPartner partner = partnerRepo.findById(req.partnerId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Partner not found"));

        Fall fall = fallRepository.findByIdWithRefs(req.fallId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fall not found"));

        // Zugriff auf den Fall (owner=Einrichtung)
        access.requireAccessToEinrichtungObject(
                fall.getTraeger().getId(),
                fall.getEinrichtungOrgUnit().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        LegalBasisType basis;
        try { basis = LegalBasisType.valueOf(req.legalBasisType()); }
        catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown legalBasisType"); }

        var requestedBy = userRepository.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        CaseShareRequest r = new CaseShareRequest();
        r.setPartner(partner);
        r.setFall(fall);
        r.setOwningTraeger(fall.getTraeger());
        r.setOwningEinrichtung(fall.getEinrichtungOrgUnit());
        r.setRequestedBy(requestedBy);
        r.setPurpose(req.purpose().trim());
        r.setLegalBasisType(basis);
        r.setNotesFrom(req.notesFrom());
        r.setNotesTo(req.notesTo());
        r.setStatus(ShareRequestStatus.OPEN);

        CaseShareRequest saved = requestRepo.save(r);

        auditService.log(AuditEventAction.INVITE_CREATED, // wenn du willst: neues AuditAction CASE_SHARE_REQUESTED anlegen
                "CaseShareRequest",
                saved.getId(),
                fall.getEinrichtungOrgUnit().getId(),
                "Share request created for partner=" + partner.getName()
        );

        return new CreateShareRequestResponse(saved.getId(), saved.getStatus().name());
    }

    // -----------------------------
    // 2) Approve (Leitung)
    // -----------------------------
    @Transactional
    public ApproveShareRequestResponse approve(Long requestId, ApproveShareRequestRequest req) {
        access.requireAny(Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        CaseShareRequest r = requestRepo.findByIdWithRefs(requestId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Share request not found"));

        if (r.getStatus() != ShareRequestStatus.OPEN) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "Request is not OPEN.");
        }

        Fall fall = fallRepository.findByIdWithRefs(r.getFall().getId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fall not found"));

        // approve darf nur die owning Einrichtung/Träger im aktuellen Kontext
        access.requireAccessToEinrichtungObject(
                fall.getTraeger().getId(),
                fall.getEinrichtungOrgUnit().getId(),
                Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        int days = (req.expiresInDays() == null) ? 7 : req.expiresInDays();
        if (days < 1 || days > 30) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "expiresInDays must be between 1 and 30");
        }

        int maxDl = (req.maxDownloads() == null) ? 5 : req.maxDownloads();
        if (maxDl < 1 || maxDl > 50) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "maxDownloads must be between 1 and 50");
        }

        var decider = userRepository.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        // snapshot payload
        String payload = builder.buildPayloadJson(fall, r.getNotesFrom(), r.getNotesTo());

        // token
        String token = ShareTokenUtil.newToken();
        String hash = ShareTokenUtil.sha256Hex(token);

        CaseTransferPackage pkg = new CaseTransferPackage();
        pkg.setShareRequest(r);
        pkg.setExpiresAt(Instant.now().plus(days, ChronoUnit.DAYS));
        pkg.setPayloadJson(payload);
        pkg.setTokenHashHex(hash);
        pkg.setMaxDownloads(maxDl);
        pkg.setDownloadCount(0);

        CaseTransferPackage savedPkg = packageRepo.save(pkg);

        r.setStatus(ShareRequestStatus.APPROVED);
        r.setDecidedAt(Instant.now());
        r.setDecidedBy(decider);
        r.setDecisionReason(req.decisionReason().trim());

        auditService.log(
                AuditEventAction.INVITE_ACCEPTED, // besser: CASE_SHARE_APPROVED (neues enum)
                "CaseTransferPackage",
                savedPkg.getId(),
                fall.getEinrichtungOrgUnit().getId(),
                "Share approved for partner=" + r.getPartner().getName()
        );

        String url = externalBaseUrl + "/share/download?token=" + token;

        return new ApproveShareRequestResponse(savedPkg.getId(), savedPkg.getExpiresAt(), url, token);
    }

    // -----------------------------
    // 3) Reject (Leitung)
    // -----------------------------
    @Transactional
    public void reject(Long requestId, RejectShareRequestRequest req) {
        access.requireAny(Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        CaseShareRequest r = requestRepo.findByIdWithRefs(requestId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Share request not found"));

        if (r.getStatus() != ShareRequestStatus.OPEN) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "Request is not OPEN.");
        }

        Fall fall = fallRepository.findByIdWithRefs(r.getFall().getId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fall not found"));

        access.requireAccessToEinrichtungObject(
                fall.getTraeger().getId(),
                fall.getEinrichtungOrgUnit().getId(),
                Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        var decider = userRepository.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        r.setStatus(ShareRequestStatus.REJECTED);
        r.setDecidedAt(Instant.now());
        r.setDecidedBy(decider);
        r.setDecisionReason(req.decisionReason().trim());

        auditService.log(
                AuditEventAction.INVITE_REVOKED, // besser: CASE_SHARE_REJECTED (neues enum)
                "CaseShareRequest",
                r.getId(),
                fall.getEinrichtungOrgUnit().getId(),
                "Share request rejected for partner=" + r.getPartner().getName()
        );
    }

    // -----------------------------
    // 4) External Download by token (no auth)
    // -----------------------------
    @Transactional
    public DownloadPackageResponse downloadByToken(String token) {
        String hash = ShareTokenUtil.sha256Hex(token.trim());

        CaseTransferPackage pkg = packageRepo.findByTokenHash(hash)
                .orElseThrow(() -> DomainException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, "Invalid token"));

        if (!pkg.canDownload()) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Package expired or download limit reached.");
        }

        pkg.setDownloadCount(pkg.getDownloadCount() + 1);

        auditService.log(
                AuditEventAction.INVITE_ACCEPTED, // besser: CASE_SHARE_DOWNLOADED
                "CaseTransferPackage",
                pkg.getId(),
                pkg.getShareRequest().getOwningEinrichtung().getId(),
                "Transfer package downloaded by partner=" + pkg.getShareRequest().getPartner().getName()
        );

        int remaining = Math.max(0, pkg.getMaxDownloads() - pkg.getDownloadCount());

        return new DownloadPackageResponse(
                pkg.getId(),
                pkg.getShareRequest().getPartner().getName(),
                pkg.getShareRequest().getFall().getId(),
                pkg.getExpiresAt(),
                remaining,
                pkg.getPayloadJson()
        );
    }
}