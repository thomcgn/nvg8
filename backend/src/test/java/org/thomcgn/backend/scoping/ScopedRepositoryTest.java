package org.thomcgn.backend.scoping;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.model.FalleroeffnungNotiz;
import org.thomcgn.backend.falloeffnungen.model.FalleroeffnungStatus;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungNotizRepository;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;
import org.thomcgn.backend.people.model.Kind;
import org.thomcgn.backend.people.repo.KindRepository;
import org.thomcgn.backend.dossiers.model.KindDossier;
import org.thomcgn.backend.dossiers.repo.KindDossierRepository;
import org.thomcgn.backend.s8a.model.S8aCase;
import org.thomcgn.backend.s8a.model.S8aRiskLevel;
import org.thomcgn.backend.s8a.model.S8aStatus;
import org.thomcgn.backend.s8a.repo.S8aCaseRepository;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.tenants.repo.TraegerRepository;
import org.thomcgn.backend.testsupport.PostgresIntegrationTestBase;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ScopedRepositoryTest extends PostgresIntegrationTestBase {

    private final TraegerRepository traegerRepo;
    private final OrgUnitRepository orgUnitRepo;
    private final UserRepository userRepo;
    private final KindRepository kindRepo;
    private final KindDossierRepository dossierRepo;
    private final FalleroeffnungRepository fallRepo;
    private final FalleroeffnungNotizRepository notizRepo;
    private final S8aCaseRepository s8aRepo;

    ScopedRepositoryTest(
            TraegerRepository traegerRepo,
            OrgUnitRepository orgUnitRepo,
            UserRepository userRepo,
            KindRepository kindRepo,
            KindDossierRepository dossierRepo,
            FalleroeffnungRepository fallRepo,
            FalleroeffnungNotizRepository notizRepo,
            S8aCaseRepository s8aRepo
    ) {
        this.traegerRepo = traegerRepo;
        this.orgUnitRepo = orgUnitRepo;
        this.userRepo = userRepo;
        this.kindRepo = kindRepo;
        this.dossierRepo = dossierRepo;
        this.fallRepo = fallRepo;
        this.notizRepo = notizRepo;
        this.s8aRepo = s8aRepo;
    }

    private Traeger t1, t2;
    private OrgUnit e1_t1, e2_t1, e1_t2;
    private User u1;
    private Kind kind;
    private KindDossier dossier_t1;
    private Falleroeffnung fall_t1_e1;
    private FalleroeffnungNotiz note_on_fall;
    private S8aCase s8a_on_fall;

    @BeforeEach
    void setup() {
        // --- Traeger ---
        t1 = new Traeger();
        t1.setName("T1");
        t1.setEnabled(true);
        t1 = traegerRepo.save(t1);

        t2 = new Traeger();
        t2.setName("T2");
        t2.setEnabled(true);
        t2 = traegerRepo.save(t2);

        // --- Einrichtungen (OrgUnits) ---
        e1_t1 = new OrgUnit();
        e1_t1.setTraeger(t1);
        e1_t1.setType(OrgUnitType.EINRICHTUNG);
        e1_t1.setName("E1-T1");
        e1_t1.setEnabled(true);
        e1_t1 = orgUnitRepo.save(e1_t1);

        e2_t1 = new OrgUnit();
        e2_t1.setTraeger(t1);
        e2_t1.setType(OrgUnitType.EINRICHTUNG);
        e2_t1.setName("E2-T1");
        e2_t1.setEnabled(true);
        e2_t1 = orgUnitRepo.save(e2_t1);

        e1_t2 = new OrgUnit();
        e1_t2.setTraeger(t2);
        e1_t2.setType(OrgUnitType.EINRICHTUNG);
        e1_t2.setName("E1-T2");
        e1_t2.setEnabled(true);
        e1_t2 = orgUnitRepo.save(e1_t2);

        // --- User (WICHTIG: passwordHash ist NOT NULL) ---
        u1 = new User();
        u1.setEmail("u1@example.com");
        u1.setPasswordHash("{noop}test");
        u1.setEnabled(true);
        u1.setVorname("U");
        u1.setNachname("One");
        u1 = userRepo.save(u1);

        // --- Kind & Dossier (T1) ---
        kind = new Kind();
        //kind.setEnabled(true);
        kind = kindRepo.save(kind);

        dossier_t1 = new KindDossier();
        dossier_t1.setTraeger(t1);
        dossier_t1.setKind(kind);
        dossier_t1.setEnabled(true);
        dossier_t1 = dossierRepo.save(dossier_t1);

        // --- Fallöffnung in (T1, E1) ---
        fall_t1_e1 = new Falleroeffnung();
        fall_t1_e1.setTraeger(t1);
        fall_t1_e1.setEinrichtungOrgUnit(e1_t1);
        fall_t1_e1.setDossier(dossier_t1);
        fall_t1_e1.setCreatedBy(u1);
        fall_t1_e1.setAktenzeichen("T1-0001");
        fall_t1_e1.setOpenedAt(Instant.now());
        fall_t1_e1.setStatus(FalleroeffnungStatus.OFFEN);
        fall_t1_e1.setTitel("Fall");
        fall_t1_e1 = fallRepo.save(fall_t1_e1);

        // --- Notiz ---
        note_on_fall = new FalleroeffnungNotiz();
        note_on_fall.setFalleroeffnung(fall_t1_e1);
        note_on_fall.setCreatedBy(u1);
        note_on_fall.setText("note");
        note_on_fall = notizRepo.save(note_on_fall);

        // --- S8aCase auf Fall ---
        s8a_on_fall = new S8aCase();
        s8a_on_fall.setFalleroeffnung(fall_t1_e1);
        s8a_on_fall.setTraeger(t1);
        s8a_on_fall.setEinrichtung(e1_t1);
        s8a_on_fall.setCreatedBy(u1);
        s8a_on_fall.setStatus(S8aStatus.DRAFT);
        s8a_on_fall.setRiskLevel(S8aRiskLevel.UNGEKLAERT);
        s8a_on_fall.setTitle("S8a");
        s8a_on_fall = s8aRepo.save(s8a_on_fall);
    }

    @Test
    void falleroeffnung_findByIdWithRefsScoped_allowsWithinCorrectContext() {
        var ok = fallRepo.findByIdWithRefsScoped(fall_t1_e1.getId(), t1.getId(), e1_t1.getId());
        assertThat(ok).isPresent();

        var wrongEinrichtung = fallRepo.findByIdWithRefsScoped(fall_t1_e1.getId(), t1.getId(), e2_t1.getId());
        assertThat(wrongEinrichtung).isEmpty();

        var wrongTraeger = fallRepo.findByIdWithRefsScoped(fall_t1_e1.getId(), t2.getId(), e1_t2.getId());
        assertThat(wrongTraeger).isEmpty();
    }

    @Test
    void notizen_findAllByFalleroeffnungIdScoped_blocksForeignIdLeak() {
        List<FalleroeffnungNotiz> ok = notizRepo.findAllByFalleroeffnungIdScopedOrderByCreatedAtAsc(
                fall_t1_e1.getId(), t1.getId(), e1_t1.getId()
        );
        assertThat(ok).hasSize(1);

        List<FalleroeffnungNotiz> wrongEinrichtung = notizRepo.findAllByFalleroeffnungIdScopedOrderByCreatedAtAsc(
                fall_t1_e1.getId(), t1.getId(), e2_t1.getId()
        );
        assertThat(wrongEinrichtung).isEmpty();
    }

    @Test
    void s8a_findByIdWithRefsScoped_blocksWrongContext() {
        var ok = s8aRepo.findByIdWithRefsScoped(s8a_on_fall.getId(), t1.getId(), e1_t1.getId());
        assertThat(ok).isPresent();

        var wrongEinrichtung = s8aRepo.findByIdWithRefsScoped(s8a_on_fall.getId(), t1.getId(), e2_t1.getId());
        assertThat(wrongEinrichtung).isEmpty();

        var wrongTraeger = s8aRepo.findByIdWithRefsScoped(s8a_on_fall.getId(), t2.getId(), e1_t2.getId());
        assertThat(wrongTraeger).isEmpty();
    }

    @Test
    void s8a_findAllByFalleroeffnungIdScopedOrderByCreatedAtDesc_blocksForeignFallIdLeak() {
        List<S8aCase> ok = s8aRepo.findAllByFalleroeffnungIdScopedOrderByCreatedAtDesc(
                fall_t1_e1.getId(), t1.getId(), e1_t1.getId()
        );
        assertThat(ok).hasSize(1);

        List<S8aCase> wrongEinrichtung = s8aRepo.findAllByFalleroeffnungIdScopedOrderByCreatedAtDesc(
                fall_t1_e1.getId(), t1.getId(), e2_t1.getId()
        );
        assertThat(wrongEinrichtung).isEmpty();
    }
}