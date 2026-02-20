package org.thomcgn.backend.teams.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.thomcgn.backend.auth.dto.AuthPrincipal;
import org.thomcgn.backend.auth.repo.UserRepository;
import org.thomcgn.backend.team.model.Team;
import org.thomcgn.backend.teams.dto.TeamDto;
import org.thomcgn.backend.teams.repo.TeamRepository;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<TeamDto> list(@AuthenticationPrincipal AuthPrincipal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        var user = userRepository.findByEmail(principal.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        var facility = user.getFacility();
        if (facility == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User hat keine Einrichtung");

        return teamRepository.findByFacilityIdOrderByNameAsc(facility.getId())
                .stream()
                .map(t -> new TeamDto(t.getId(), t.getName()))
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAMLEITUNG')")
    public TeamDto create(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody java.util.Map<String, String> body
    ) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        String name = body.get("name");
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name erforderlich");
        }

        var user = userRepository.findByEmail(principal.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        var facility = user.getFacility();
        if (facility == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User hat keine Einrichtung");

        if (teamRepository.existsByFacilityIdAndNameIgnoreCase(facility.getId(), name.trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Team existiert bereits");
        }

        Team t = new Team();
        t.setName(name.trim());
        t.setFacility(facility);

        Team saved = teamRepository.save(t);
        return new TeamDto(saved.getId(), saved.getName());
    }
}
