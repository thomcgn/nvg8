package org.thomcgn.backend.facility.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.facility.dto.AssignUserOrgRequest;
import org.thomcgn.backend.facility.service.UserOrgService;

import java.util.LinkedHashSet;
import java.util.Set;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class FacilityTeamController {

    private final UserOrgService userOrgService;

    @PostMapping("/assign-org")
    public ResponseEntity<?> assign(@RequestBody AssignUserOrgRequest req) {

        // teamIds aus single+multi normalisieren
        Set<Long> ids = new LinkedHashSet<>();
        if (req.teamId() != null) ids.add(req.teamId());
        if (req.teamIds() != null) ids.addAll(req.teamIds());

        boolean replace = req.replaceTeams() != null && req.replaceTeams();

        userOrgService.assign(req.userId(), req.facilityId(), ids, replace);
        return ResponseEntity.ok().build();
    }
}
