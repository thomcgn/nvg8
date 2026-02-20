package org.thomcgn.backend.facility.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.thomcgn.backend.auth.repo.UserRepository;
import org.thomcgn.backend.facility.repo.FacilityRepository;
import org.thomcgn.backend.teams.repo.TeamRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserOrgService {

    private final UserRepository userRepository;
    private final FacilityRepository facilityRepository;
    private final TeamRepository teamRepository;

    /**
     * Assign facility + (optional) teams.
     * teamsMode:
     * - replaceTeams=true  => User-Teams werden exakt auf teamIds gesetzt
     * - replaceTeams=false => teamIds werden zusätzlich hinzugefügt (add)
     */
    @Transactional
    public void assign(Long userId, Long facilityId, Set<Long> teamIds, boolean replaceTeams) {
        if (userId == null) throw badRequest("userId erforderlich");
        if (facilityId == null) throw badRequest("facilityId erforderlich");

        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User nicht gefunden"));

        var facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Einrichtung nicht gefunden"));

        // Facility setzen
        user.setFacility(facility);

        // Teams optional
        Set<Long> normalized = normalizeTeamIds(teamIds);

        if (normalized.isEmpty()) {
            // Wenn replaceTeams: leeren (UI: "keine Teams")
            if (replaceTeams) {
                user.getTeams().clear();
            }
            userRepository.save(user);
            return;
        }

        // Teams laden
        var teams = teamRepository.findAllById(normalized);
        if (teams.size() != normalized.size()) {
            // fehlende IDs ermitteln (nice für Debug)
            Set<Long> found = teams.stream().map(t -> t.getId()).collect(Collectors.toSet());
            Set<Long> missing = new HashSet<>(normalized);
            missing.removeAll(found);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team(s) nicht gefunden: " + missing);
        }

        // Facility-Check (jedes Team muss zur Facility gehören)
        for (var team : teams) {
            if (team.getFacility() == null || team.getFacility().getId() == null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Team hat keine Facility-Zuordnung");
            }
            if (!team.getFacility().getId().equals(facility.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Team " + team.getId() + " gehört nicht zur Einrichtung " + facility.getId()
                );
            }
        }

        if (replaceTeams) {
            user.getTeams().clear();
        }
        user.getTeams().addAll(teams);

        userRepository.save(user);
    }

    /** Convenience: single team */
    @Transactional
    public void assign(Long userId, Long facilityId, Long teamId) {
        Set<Long> ids = (teamId == null) ? Set.of() : Set.of(teamId);
        // single-assign macht i.d.R. "add" Sinn – wenn du "ersetzen" willst: true setzen
        assign(userId, facilityId, ids, false);
    }

    private static Set<Long> normalizeTeamIds(Set<Long> teamIds) {
        if (teamIds == null) return Set.of();
        return teamIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static ResponseStatusException badRequest(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
