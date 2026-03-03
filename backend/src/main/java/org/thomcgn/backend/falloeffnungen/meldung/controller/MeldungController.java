    package org.thomcgn.backend.falloeffnungen.meldung.controller;

    import org.springframework.web.bind.annotation.*;
    import org.thomcgn.backend.falloeffnungen.meldung.dto.*;
    import org.thomcgn.backend.falloeffnungen.meldung.service.MeldungService;

    import java.util.List;

    @RestController
    @RequestMapping("/falloeffnungen/{fallId}/meldungen")
    public class MeldungController {

        private final MeldungService service;

        public MeldungController(MeldungService service) {
            this.service = service;
        }

        @GetMapping
        public List<MeldungListItemResponse> list(@PathVariable Long fallId) {
            return service.list(fallId);
        }

        @GetMapping("/current")
        public MeldungResponse current(@PathVariable Long fallId) {
            return service.current(fallId);
        }

        @GetMapping("/{meldungId}")
        public MeldungResponse get(@PathVariable Long fallId, @PathVariable Long meldungId) {
            return service.get(fallId, meldungId);
        }

        @PostMapping
        public MeldungResponse createNew(@PathVariable Long fallId, @RequestBody(required = false) MeldungCreateRequest req) {
            return service.createNew(fallId, req);
        }

        @PostMapping("/correct")
        public MeldungResponse startCorrection(@PathVariable Long fallId, @RequestBody MeldungCorrectRequest req) {
            return service.startCorrection(fallId, req);
        }

        @PutMapping("/{meldungId}/draft")
        public MeldungResponse saveDraft(@PathVariable Long fallId, @PathVariable Long meldungId, @RequestBody MeldungDraftRequest req) {
            return service.saveDraft(fallId, meldungId, req);
        }

        @PostMapping("/{meldungId}/submit")
        public MeldungResponse submit(@PathVariable Long fallId, @PathVariable Long meldungId, @RequestBody(required = false) MeldungSubmitRequest req) {
            return service.submit(fallId, meldungId, req);
        }
    }