package org.thomcgn.backend.teams.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.service.AdminGuard;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.model.OrgUnitMembership;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.orgunits.repo.OrgUnitMembershipRepository;
import org.thomcgn.backend.teams.dto.AssignUserToTeamRequest;
import org.thomcgn.backend.teams.dto.TeamMemberListItem;
import org.thomcgn.backend.teams.dto.TeamMembershipResponse;
import org.thomcgn.backend.teams.dto.UpdateTeamMembershipRequest;
import org.thomcgn.backend.teams.model.TeamMembershipType;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.List;

@Service
public class TeamMembershipService {

    private final OrgUnitMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final AdminGuard adminGuard;

    public TeamMembershipService(
            OrgUnitMembershipRepository membershipRepository,
            UserRepository userRepository,
            AdminGuard adminGuard
    ) {
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.adminGuard = adminGuard;
    }

    @Transactional
    public TeamMembershipResponse assign(AssignUserToTeamRequest req) {
        User user = userRepository.findById(req.userId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        OrgUnit team = adminGuard.requireCanManageOrgUnit(req.teamOrgUnitId());
        requireTeam(team);

        TeamMembershipType membershipType = parseMembershipType(req.membershipType());
        boolean primary = Boolean.TRUE.equals(req.primary());

        OrgUnitMembership membership = membershipRepository
                .findByUserIdAndOrgUnitIdAndRoleIsNull(user.getId(), team.getId())
                .map(existing -> {
                    existing.setEnabled(true);
                    existing.setMembershipType(membershipType.name());
                    return existing;
                })
                .orElseGet(() -> {
                    OrgUnitMembership created = new OrgUnitMembership();
                    created.setUser(user);
                    created.setOrgUnit(team);
                    created.setMembershipType(membershipType.name());
                    created.setEnabled(true);
                    return created;
                });

        if (primary) {
            clearPrimaryMemberships(user.getId());
            membership.setPrimary(true);
        } else if (membershipRepository.findByUserIdAndPrimaryTrueAndEnabledTrue(user.getId()).isEmpty()) {
            membership.setPrimary(true);
        }

        OrgUnitMembership saved = membershipRepository.save(membership);

        ensureFachbereichMembership(user, team);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TeamMemberListItem> listMembers(Long teamOrgUnitId) {
        OrgUnit team = adminGuard.requireCanManageOrgUnit(teamOrgUnitId);
        requireTeam(team);

        return membershipRepository
                .findByOrgUnitIdAndMembershipTypeIsNotNullAndEnabledTrueOrderByCreatedAtAsc(teamOrgUnitId).stream()
                .map(m -> new TeamMemberListItem(
                        m.getId(),
                        m.getUser().getId(),
                        m.getUser().getDisplayName(),
                        m.getUser().getEmail(),
                        m.getMembershipType(),
                        m.isPrimary(),
                        m.isEnabled()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TeamMembershipResponse> listForUser(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        return membershipRepository
                .findByUserIdAndMembershipTypeIsNotNullAndEnabledTrueOrderByCreatedAtAsc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TeamMembershipResponse update(Long membershipId, UpdateTeamMembershipRequest req) {
        OrgUnitMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Team membership not found"));

        adminGuard.requireCanManageOrgUnit(membership.getOrgUnit().getId());
        requireTeam(membership.getOrgUnit());

        if (req.membershipType() != null && !req.membershipType().isBlank()) {
            membership.setMembershipType(parseMembershipType(req.membershipType()).name());
        }

        if (req.enabled() != null) {
            membership.setEnabled(req.enabled());
        }

        if (req.primary() != null && req.primary()) {
            clearPrimaryMemberships(membership.getUser().getId());
            membership.setPrimary(true);
        } else if (req.primary() != null) {
            membership.setPrimary(false);
        }

        return toResponse(membershipRepository.save(membership));
    }

    @Transactional
    public void disable(Long membershipId) {
        OrgUnitMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Team membership not found"));

        adminGuard.requireCanManageOrgUnit(membership.getOrgUnit().getId());
        requireTeam(membership.getOrgUnit());

        membership.setEnabled(false);
        membership.setPrimary(false);
    }

    private void ensureFachbereichMembership(User user, OrgUnit team) {
        OrgUnit parent = team.getParent();
        if (parent == null || parent.getType() != OrgUnitType.ABTEILUNG) {
            return;
        }

        if (membershipRepository.existsByUserIdAndOrgUnitIdAndEnabledTrue(user.getId(), parent.getId())) {
            return;
        }

        OrgUnitMembership fachbereichRole = new OrgUnitMembership();
        fachbereichRole.setUser(user);
        fachbereichRole.setOrgUnit(parent);
        fachbereichRole.setRole("FACHKRAFT");
        fachbereichRole.setEnabled(true);
        membershipRepository.save(fachbereichRole);
    }

    private void clearPrimaryMemberships(Long userId) {
        membershipRepository.findByUserIdAndPrimaryTrueAndEnabledTrue(userId)
                .forEach(m -> m.setPrimary(false));
    }

    private void requireTeam(OrgUnit orgUnit) {
        if (orgUnit.getType() != OrgUnitType.TEAM) {
            throw DomainException.badRequest(
                    ErrorCode.VALIDATION_FAILED,
                    "Target org unit must be of type TEAM."
            );
        }
    }

    private TeamMembershipType parseMembershipType(String raw) {
        try {
            return TeamMembershipType.valueOf(raw);
        } catch (IllegalArgumentException ex) {
            throw DomainException.badRequest(
                    ErrorCode.VALIDATION_FAILED,
                    "Unknown membershipType: " + raw
            );
        }
    }

    private TeamMembershipResponse toResponse(OrgUnitMembership m) {
        return new TeamMembershipResponse(
                m.getId(),
                m.getUser().getId(),
                m.getOrgUnit().getId(),
                m.getOrgUnit().getName(),
                m.getMembershipType(),
                m.isPrimary(),
                m.isEnabled()
        );
    }
}
