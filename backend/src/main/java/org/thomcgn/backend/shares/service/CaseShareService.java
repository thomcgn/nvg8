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
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.shares.dto.*;
import org.thomcgn.backend.shares.model.*;
import org.thomcgn.backend.shares.repo.CaseShareRequestRepository;
import org.thomcgn.backend.shares.repo.CaseTransferPackageRepository;
import org.thomcgn.backend.shares.repo.ExternalPartnerRepository;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class CaseShareService {

    private final ExternalPartnerRepository partnerRepo;
    private final CaseShareRequestRepository requestRepo;
    private final CaseTransferPackageRepository packageRepo;
    private final FalleroeffnungRepository fallRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;
    private final AuditService audit;
    private final CaseTransferPackageBuilder builder;

    public CaseShareService(ExternalPartnerRepository partnerRepo,
                            CaseShareRequestRepository requestRepo,
                            CaseTransferPackageRepository packageRepo,
                            FalleroeffnungRepository fallRepo,
                            UserRepository userRepo,
                            AccessControlService access,
                            AuditService audit,
                            CaseTransferPackageBuilder builder) {
        this.partnerRepo = partnerRepo;
        this.requestRepo = requestRepo;
        this.packageRepo = packageRepo;
        this.fallRepo = fallRepo;
        this.userRepo = userRepo;
        this.access = access;
        this.audit = audit;
        this.builder = builder;
    }

    @Transactional
    public CreateShareRequestResponse createRequest(CreateShareRequestRequest req) {
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        var partner = partnerRepo.findById(req.partnerId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Partner not found"));

        var fall = fallRepo.findByIdWithRefs(req.falleroeffnungId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Falleröffnung not found"));

        access.requireAccessToEinrichtungObject(
                fall.getTraeger().getId(),
                fall.getEinrichtungOrgUnit().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        LegalBasisType basis;
        try { basis = LegalBasisType.valueOf(req.legalBasisType()); }
        catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown legalBasisType"); }

        User requestedBy = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        CaseShareRequest r = new CaseShareRequest();
        r.setPartner(partner);
        r.setFalleroeffnung(fall);
        r.setOwningTraeger(fall.getTraeger());
        r.setOwningEinrichtung(fall.getEinrichtungOrgUnit());
        r.setRequestedBy(requestedBy);
        r.setPurpose(req.purpose());
        r.setLegalBasisType(basis);
        r.setNotesFrom(req.notesFrom());
        r.setNotesTo(req.notesTo());
        r.setStatus(ShareRequestStatus.OPEN);

        var saved = requestRepo.save(r);

        audit.log(AuditEventAction.CASE_SHARE_REQUESTED, "CaseShareRequest", saved.getId(),
                fall.getEinrichtungOrgUnit().getId(), "Share request created");

        return new CreateShareRequestResponse(saved.getId(), saved.getStatus().name());
    }

    @Transactional
    public DownloadPackageResponse downloadByToken(String token) {
        String hash = ShareTokenUtil.sha256Hex(token.trim());

        CaseTransferPackage pkg = packageRepo.findByTokenHash(hash)
                .orElseThrow(() -> DomainException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, "Invalid token"));

        if (pkg.isExpired()) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Package expired.");
        }
        if (!pkg.canDownload()) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Download limit reached.");
        }

        pkg.setDownloadCount(pkg.getDownloadCount() + 1);
        packageRepo.save(pkg);

        return new DownloadPackageResponse(
                pkg.getId(),
                "OK",
                pkg.getShareRequest().getId(),
                pkg.getExpiresAt(),
                pkg.getDownloadCount(),
                pkg.getPayloadJson()
        );
    }

    @Transactional
    public ApproveShareRequestResponse approve(Long requestId, ApproveShareRequestRequest req) {
        DecisionContext ctx = loadDecisionContext(requestId);

        int days = (req.expiresInDays() == null) ? 7 : req.expiresInDays();
        int maxDl = (req.maxDownloads() == null) ? 5 : req.maxDownloads();

        String payload = builder.buildPayloadJson(ctx.fall, ctx.request.getNotesFrom(), ctx.request.getNotesTo());

        String token = ShareTokenUtil.newToken();
        String tokenHash = ShareTokenUtil.sha256Hex(token);

        CaseTransferPackage pkg = new CaseTransferPackage();
        pkg.setShareRequest(ctx.request);
        pkg.setExpiresAt(Instant.now().plus(days, ChronoUnit.DAYS));
        pkg.setPayloadJson(payload);
        pkg.setTokenHashHex(tokenHash);
        pkg.setMaxDownloads(maxDl);
        pkg.setDownloadCount(0);

        CaseTransferPackage savedPkg = packageRepo.save(pkg);

        markDecision(ctx, ShareRequestStatus.APPROVED, req.decisionReason());

        audit.log(AuditEventAction.CASE_SHARE_APPROVED, "CaseTransferPackage", savedPkg.getId(),
                ctx.fall.getEinrichtungOrgUnit().getId(), "Share approved");

        String url = "https://external.example.com/share/download?token=" + token;
        return new ApproveShareRequestResponse(savedPkg.getId(), savedPkg.getExpiresAt(), url, token);
    }

    @Transactional
    public RejectShareRequestResponse reject(Long requestId, RejectShareRequestRequest req) {
        DecisionContext ctx = loadDecisionContext(requestId);

        markDecision(ctx, ShareRequestStatus.REJECTED, req.decisionReason());

        audit.log(AuditEventAction.CASE_SHARE_REJECTED, "CaseShareRequest", ctx.request.getId(),
                ctx.fall.getEinrichtungOrgUnit().getId(), "Share request rejected");

        return new RejectShareRequestResponse(ctx.request.getId(), ctx.request.getStatus().name());
    }

    // ---------------------------
    // Shared decision logic
    // ---------------------------

    private DecisionContext loadDecisionContext(Long requestId) {
        access.requireAny(Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        CaseShareRequest r = requestRepo.findByIdWithRefs(requestId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Share request not found"));

        if (r.getStatus() != ShareRequestStatus.OPEN) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "Request is not OPEN.");
        }

        var fall = fallRepo.findByIdWithRefs(r.getFalleroeffnung().getId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Falleröffnung not found"));

        access.requireAccessToEinrichtungObject(
                fall.getTraeger().getId(),
                fall.getEinrichtungOrgUnit().getId(),
                Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        User actor = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        return new DecisionContext(r, fall, actor);
    }

    private void markDecision(DecisionContext ctx, ShareRequestStatus status, String reason) {
        ctx.request.setStatus(status);
        ctx.request.setDecidedAt(Instant.now());
        ctx.request.setDecidedBy(ctx.actor);
        ctx.request.setDecisionReason(reason);
        requestRepo.save(ctx.request);
    }

    private record DecisionContext(CaseShareRequest request,
                                   org.thomcgn.backend.falloeffnungen.model.Falleroeffnung fall,
                                   User actor) {}
}