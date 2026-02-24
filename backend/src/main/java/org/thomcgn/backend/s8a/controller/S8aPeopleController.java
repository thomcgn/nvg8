package org.thomcgn.backend.s8a.controller;

import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.s8a.dto.*;
import org.thomcgn.backend.s8a.service.S8aPeopleService;

import java.util.List;

/**
 * §8a: Pflege von Beteiligten (CasePerson), Beziehungen, Sorgerecht/Aufenthalt,
 * Kontaktregelungen/Sperren und Verfügungen/Beschlüssen.
 *
 * Scope: immer innerhalb eines S8aCase.
 */
@RestController
@RequestMapping("/api/s8a/cases/{s8aCaseId}/people")
public class S8aPeopleController {

    private final S8aPeopleService service;

    public S8aPeopleController(S8aPeopleService service) {
        this.service = service;
    }

    // -------- LIST --------

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

    // -------- CREATE --------

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