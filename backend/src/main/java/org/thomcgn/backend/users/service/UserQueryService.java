package org.thomcgn.backend.users.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.users.dto.OrgUnitUserResponse;
import org.thomcgn.backend.users.dto.UserListItemResponse;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.model.UserOrgRole;
import org.thomcgn.backend.users.repo.UserOrgRoleRepository;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.*;

@Service
public class UserQueryService {

    private final UserOrgRoleRepository userOrgRoleRepository;
    private final UserRepository userRepository;

    public UserQueryService(UserOrgRoleRepository userOrgRoleRepository, UserRepository userRepository) {
        this.userOrgRoleRepository = userOrgRoleRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<OrgUnitUserResponse> listUsersForOrgUnit(Long orgUnitId) {
        List<UserOrgRole> rows = userOrgRoleRepository.findAllEnabledByOrgUnitIdWithUser(orgUnitId);

        // Aggregiere pro User — erhalte alle Role-Assignments mit ID
        Map<Long, UserRoleAgg> map = new LinkedHashMap<>();
        for (UserOrgRole uor : rows) {
            var u = uor.getUser();
            map.computeIfAbsent(u.getId(), _id -> new UserRoleAgg(u.getId(), u.getEmail(), u.getDisplayName(), u.isEnabled()))
                    .assignments.add(new OrgUnitUserResponse.RoleAssignment(uor.getId(), uor.getRole().name()));
        }

        return map.values().stream()
                .map(a -> new OrgUnitUserResponse(a.id, a.email, a.displayName, a.enabled, List.copyOf(a.assignments)))
                .sorted(Comparator.comparing(OrgUnitUserResponse::displayName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserListItemResponse> listUsersForCurrentTraeger() {
        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        return userRepository.findAllEnabledByTraegerId(traegerId).stream()
                .map(u -> new UserListItemResponse(u.getId(), u.getEmail(), u.getDisplayName(), u.isEnabled(), Set.of()))
                .toList();
    }

    private static class UserRoleAgg {
        final Long id;
        final String email;
        final String displayName;
        final boolean enabled;
        final List<OrgUnitUserResponse.RoleAssignment> assignments = new ArrayList<>();

        UserRoleAgg(Long id, String email, String displayName, boolean enabled) {
            this.id = id; this.email = email; this.displayName = displayName; this.enabled = enabled;
        }
    }
}