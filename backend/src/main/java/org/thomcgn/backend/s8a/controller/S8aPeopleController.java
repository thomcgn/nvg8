package org.thomcgn.backend.s8a.controller;

import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.s8a.dto.*;
import org.thomcgn.backend.s8a.service.S8aPeopleService;

import java.util.List;

@RestController
@RequestMapping("/api/s8a/cases/{s8aCaseId}/people")
public class S8aPeopleController {

    private final S8aPeopleService service;

    public S8aPeopleController(S8aPeopleService service) {
        this.service = service;
    }

    @GetMapping
    public List<S8aCasePersonResponse> listPersons(@PathVariable Long s8aCaseId) {
        return service.listPersons(s8aCaseId);
    }

    @GetMapping("/relations")
    public List<S8aRelationResponse> listRelations(@PathVariable Long s8aCaseId) {
        return service.listRelations(s8aCaseId);
    }

    @GetMapping("/custody-records")
    public List<S8aCustodyRecordResponse> listCustodyRecords(@PathVariable Long s8aCaseId,
                                                             @RequestParam(required = false) Long childPersonId) {
        return service.listCustodyRecords(s8aCaseId, childPersonId);
    }

    @GetMapping("/contact-restrictions")
    public List<S8aContactRestrictionResponse> listContactRestrictions(@PathVariable Long s8aCaseId,
                                                                       @RequestParam(required = false) Long childPersonId) {
        return service.listContactRestrictions(s8aCaseId, childPersonId);
    }

    @GetMapping("/orders")
    public List<S8aOrderResponse> listOrders(@PathVariable Long s8aCaseId) {
        return service.listOrders(s8aCaseId);
    }
}