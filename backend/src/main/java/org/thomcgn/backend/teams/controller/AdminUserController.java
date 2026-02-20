package org.thomcgn.backend.teams.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.thomcgn.backend.auth.dto.AuthPrincipal;
import org.thomcgn.backend.auth.repo.UserRepository;
import org.thomcgn.backend.teams.dto.TeamDto;
import org.thomcgn.backend.teams.dto.UpdateTeamsRequest;
import org.thomcgn.backend.teams.dto.UserAdminRowDto;
import org.thomcgn.backend.teams.repo.TeamRepository;

import java.util.List;

;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAMLEITUNG')")
    public List<UserAdminRowDto> list(@AuthenticationPrincipal AuthPrincipal principal) {
        var actor = userRepository.findByEmail(principal.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        var facility = actor.getFacility();
        if (facility == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Keine Einrichtung");

        return userRepository.findAllInFacilityWithTeams(facility.getId())
                .stream()
                .map(u -> new UserAdminRowDto(
                        u.getId(),
                        u.getEmail(),
                        u.getVorname(),
                        u.getNachname(),
                        u.getRole().name(),
                        u.getLastLogin(),
                        u.getTeams().stream()
                                .map(t -> new TeamDto(t.getId(), t.getName()))
                                .sorted(java.util.Comparator.comparing(TeamDto::name, String.CASE_INSENSITIVE_ORDER))
                                .toList()
                ))
                .sorted(java.util.Comparator.comparing((UserAdminRowDto x) -> (x.nachname() == null ? "" : x.nachname()).toLowerCase()))
                .toList();
    }
    @PatchMapping("/{id}/teams")
    @PreAuthorize("hasAnyRole('ADMIN','TEAMLEITUNG')")
    public UserAdminRowDto updateTeams(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable Long id,
            @RequestBody UpdateTeamsRequest req
    ) {
        var actor = userRepository.findByEmail(principal.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        var facility = actor.getFacility();
        if (facility == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Keine Einrichtung");

        var user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User nicht gefunden"));

        // Sicherheitsregel: nur User in gleicher Facility bearbeiten
        if (user.getFacility() == null || !user.getFacility().getId().equals(facility.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nicht erlaubt");
        }

        var ids = (req.teamIds() == null) ? List.<Long>of() : req.teamIds();

        // Teams nur aus eigener Facility zulassen
        var teams = ids.stream()
                .distinct()
                .map(teamId -> teamRepository.findByIdAndFacilityId(teamId, facility.getId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ungültiges Team: " + teamId)))
                .collect(java.util.stream.Collectors.toSet());

        user.setTeams(teams);
        var saved = userRepository.save(user);

        return new UserAdminRowDto(
                saved.getId(),
                saved.getEmail(),
                saved.getVorname(),
                saved.getNachname(),
                saved.getRole().name(),
                saved.getLastLogin(),
                saved.getTeams().stream().map(t -> new TeamDto(t.getId(), t.getName())).toList()
        );
    }
}
