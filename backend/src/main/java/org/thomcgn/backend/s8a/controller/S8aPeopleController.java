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

    @PostMapping
    public S8aCasePersonResponse createPerson(@PathVariable Long s8aCaseId,
                                              @RequestBody CreateS8aCasePersonRequest req) {
        return service.createPerson(s8aCaseId, req);
    }

    @PostMapping("/relations")
    public S8aRelationResponse createRelation(@PathVariable Long s8aCaseId,
                                              @RequestBody CreateS8aRelationRequest req) {
        return service.createRelation(s8aCaseId, req);
    }

    @PostMapping("/custody-records")
    public void addCustodyRecord(@PathVariable Long s8aCaseId,
                                 @RequestBody CreateS8aCustodyRecordRequest req) {
        service.addCustodyRecord(s8aCaseId, req);
    }

    @PostMapping("/contact-restrictions")
    public void addContactRestriction(@PathVariable Long s8aCaseId,
                                      @RequestBody CreateS8aContactRestrictionRequest req) {
        service.addContactRestriction(s8aCaseId, req);
    }

    @PostMapping("/orders")
    public void addOrder(@PathVariable Long s8aCaseId,
                         @RequestBody CreateS8aOrderRequest req) {
        service.addOrder(s8aCaseId, req);
    }
}