package org.thomcgn.backend.teams.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.service.AdminGuard;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.teams.dto.AssignUserToTeamRequest;
import org.thomcgn.backend.teams.dto.TeamMemberListItem;
import org.thomcgn.backend.teams.dto.TeamMembershipResponse;
import org.thomcgn.backend.teams.dto.UpdateTeamMembershipRequest;
import org.thomcgn.backend.teams.model.TeamMembershipType;
import org.thomcgn.backend.teams.model.UserTeamMembership;
import org.thomcgn.backend.teams.repo.UserTeamMembershipRepository;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.List;

@Service
public class TeamMembershipService {

    private final UserTeamMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final AdminGuard adminGuard;

    public TeamMembershipService(
            UserTeamMembershipRepository membershipRepository,
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

        UserTeamMembership membership = membershipRepository.findByUserIdAndTeamOrgUnitId(user.getId(), team.getId())
                .map(existing -> {
                    existing.setEnabled(true);
                    existing.setMembershipType(membershipType);
                    return existing;
                })
                .orElseGet(() -> {
                    UserTeamMembership created = new UserTeamMembership();
                    created.setUser(user);
                    created.setTeamOrgUnit(team);
                    created.setMembershipType(membershipType);
                    created.setEnabled(true);
                    return created;
                });

        if (primary) {
            clearPrimaryMemberships(user.getId());
            membership.setPrimary(true);
        } else if (membershipRepository.findByUserIdAndPrimaryTrueAndEnabledTrue(user.getId()).isEmpty()) {
            membership.setPrimary(true);
        }

        UserTeamMembership saved = membershipRepository.save(membership);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TeamMemberListItem> listMembers(Long teamOrgUnitId) {
        OrgUnit team = adminGuard.requireCanManageOrgUnit(teamOrgUnitId);
        requireTeam(team);

        return membershipRepository.findByTeamOrgUnitIdAndEnabledTrueOrderByCreatedAtAsc(teamOrgUnitId).stream()
                .map(m -> new TeamMemberListItem(
                        m.getId(),
                        m.getUser().getId(),
                        m.getUser().getDisplayName(),
                        m.getUser().getEmail(),
                        m.getMembershipType().name(),
                        m.isPrimary(),
                        m.isEnabled()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TeamMembershipResponse> listForUser(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        return membershipRepository.findByUserIdAndEnabledTrueOrderByCreatedAtAsc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TeamMembershipResponse update(Long membershipId, UpdateTeamMembershipRequest req) {
        UserTeamMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Team membership not found"));

        adminGuard.requireCanManageOrgUnit(membership.getTeamOrgUnit().getId());
        requireTeam(membership.getTeamOrgUnit());

        if (req.membershipType() != null && !req.membershipType().isBlank()) {
            membership.setMembershipType(parseMembershipType(req.membershipType()));
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

        UserTeamMembership saved = membershipRepository.save(membership);
        return toResponse(saved);
    }

    @Transactional
    public void disable(Long membershipId) {
        UserTeamMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Team membership not found"));

        adminGuard.requireCanManageOrgUnit(membership.getTeamOrgUnit().getId());
        requireTeam(membership.getTeamOrgUnit());

        membership.setEnabled(false);
        membership.setPrimary(false);
    }

    private void clearPrimaryMemberships(Long userId) {
        List<UserTeamMembership> primaryMemberships =
                membershipRepository.findByUserIdAndPrimaryTrueAndEnabledTrue(userId);

        for (UserTeamMembership m : primaryMemberships) {
            m.setPrimary(false);
        }
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

    private TeamMembershipResponse toResponse(UserTeamMembership membership) {
        return new TeamMembershipResponse(
                membership.getId(),
                membership.getUser().getId(),
                membership.getTeamOrgUnit().getId(),
                membership.getTeamOrgUnit().getName(),
                membership.getMembershipType().name(),
                membership.isPrimary(),
                membership.isEnabled()
        );
    }
}