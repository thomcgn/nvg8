package org.thomcgn.backend.facility.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.thomcgn.backend.facility.repo.FacilityRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/facilities")
@RequiredArgsConstructor
public class FacilityPublicController {

    private final FacilityRepository facilityRepository;

    @GetMapping("/public")
    public List<Map<String, Object>> list() {
        return facilityRepository.findAll()
                .stream()
                .map(f -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", f.getId());
                    m.put("name", f.getName());
                    return m;
                })
                .toList();
    }
}
