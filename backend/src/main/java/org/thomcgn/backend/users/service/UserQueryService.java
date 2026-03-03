package org.thomcgn.backend.users.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.users.dto.UserListItemResponse;
import org.thomcgn.backend.users.model.UserOrgRole;
import org.thomcgn.backend.users.repo.UserOrgRoleRepository;

import java.util.*;

@Service
public class UserQueryService {

    private final UserOrgRoleRepository userOrgRoleRepository;

    public UserQueryService(UserOrgRoleRepository userOrgRoleRepository) {
        this.userOrgRoleRepository = userOrgRoleRepository;
    }

    @Transactional(readOnly = true)
    public List<UserListItemResponse> listUsersForOrgUnit(Long orgUnitId) {
        List<UserOrgRole> rows = userOrgRoleRepository.findAllEnabledByOrgUnitIdWithUser(orgUnitId);

        Map<Long, UserAgg> map = new LinkedHashMap<>();
        for (UserOrgRole uor : rows) {
            var u = uor.getUser();
            map.computeIfAbsent(u.getId(), _id -> new UserAgg(u.getId(), u.getEmail(), u.getDisplayName(), u.isEnabled()))
                    .roles.add(uor.getRole().name());
        }

        return map.values().stream()
                .map(a -> new UserListItemResponse(a.id, a.email, a.displayName, a.enabled, a.roles))
                .sorted(Comparator.comparing(UserListItemResponse::displayName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    private static class UserAgg {
        final Long id;
        final String email;
        final String displayName;
        final boolean enabled;
        final Set<String> roles = new TreeSet<>();

        UserAgg(Long id, String email, String displayName, boolean enabled) {
            this.id = id; this.email = email; this.displayName = displayName; this.enabled = enabled;
        }
    }
}