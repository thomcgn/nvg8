package org.thomcgn.backend.falloeffnungen.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;
import org.thomcgn.backend.audit.service.AuditService;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.dossiers.repo.KindDossierRepository;
import org.thomcgn.backend.falloeffnungen.dto.UpdateFalleroeffnungStatusRequest;
import org.thomcgn.backend.falloeffnungen.meldung.model.Dringlichkeit;
import org.thomcgn.backend.falloeffnungen.meldung.model.Meldung;
import org.thomcgn.backend.falloeffnungen.meldung.repo.MeldungRepository;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.model.FalleroeffnungStatus;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungNotizRepository;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.falloeffnungen.risk.repo.FalleroeffnungAnlassRepository;
import org.thomcgn.backend.falloeffnungen.risk.repo.FalleroeffnungNotizTagRepository;
import org.thomcgn.backend.falloeffnungen.risk.service.FallRiskService;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;
import org.thomcgn.backend.people.repo.KindRepository;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.tenants.repo.TraegerRepository;
import org.thomcgn.backend.users.repo.UserRepository;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FalleroeffnungServiceTest {

    @Mock FalleroeffnungRepository repo;
    @Mock FalleroeffnungNotizRepository notizRepo;
    @Mock KindDossierRepository dossierRepo;
    @Mock KindRepository kindRepo;
    @Mock TraegerRepository traegerRepo;
    @Mock OrgUnitRepository orgUnitRepo;
    @Mock UserRepository userRepo;
    @Mock AccessControlService access;
    @Mock AuditService audit;
    @Mock org.thomcgn.backend.aktenzeichen.service.AktennummerService aktennummerService;
    @Mock DossierFallNoService dossierFallNoService;
    @Mock FalleroeffnungAnlassRepository anlassRepo;
    @Mock FalleroeffnungNotizTagRepository tagRepo;
    @Mock FallRiskService riskService;
    @Mock MeldungRepository meldungRepo;

    @InjectMocks
    FalleroeffnungService service;

    private static final long TRAEGER_ID  = 1L;
    private static final long ORG_UNIT_ID = 10L;
    private static final long FALL_ID     = 42L;

    /** Builds a minimal OFFEN Falleroeffnung with real entity objects. */
    private Falleroeffnung openFall() {
        Traeger traeger = new Traeger();
        ReflectionTestUtils.setField(traeger, "id", TRAEGER_ID);

        OrgUnit einrichtung = new OrgUnit();
        ReflectionTestUtils.setField(einrichtung, "id", ORG_UNIT_ID);

        Falleroeffnung fall = mock(Falleroeffnung.class);
        when(fall.getId()).thenReturn(FALL_ID);
        when(fall.getStatus()).thenReturn(FalleroeffnungStatus.OFFEN);
        when(fall.getTraeger()).thenReturn(traeger);
        when(fall.getEinrichtungOrgUnit()).thenReturn(einrichtung);
        return fall;
    }

    private void stubSecurityContext(MockedStatic<SecurityUtils> sec) {
        sec.when(SecurityUtils::currentTraegerIdRequired).thenReturn(TRAEGER_ID);
        sec.when(SecurityUtils::currentOrgUnitIdRequired).thenReturn(ORG_UNIT_ID);
        sec.when(SecurityUtils::currentUserId).thenReturn(1L);
    }

    // ── Business rule: future naechsteUeberpruefungAm blocks ABGESCHLOSSEN ───

    @Test
    void updateStatus_blocked_when_futureNaechsteUeberpruefungAm() {
        try (MockedStatic<SecurityUtils> sec = mockStatic(SecurityUtils.class)) {
            stubSecurityContext(sec);
            Falleroeffnung fall0 = openFall();
            when(repo.findByIdWithRefsScoped(FALL_ID, TRAEGER_ID, ORG_UNIT_ID))
                    .thenReturn(Optional.of(fall0));

            Meldung meldung0 = new Meldung();
            meldung0.setNaechsteUeberpruefungAm(LocalDate.now().plusDays(30));
            when(meldungRepo.findCurrentByFallId(FALL_ID)).thenReturn(Optional.of(meldung0));

            assertThatThrownBy(() ->
                    service.updateStatus(FALL_ID, new UpdateFalleroeffnungStatusRequest("ABGESCHLOSSEN"))
            )
                    .isInstanceOf(DomainException.class)
                    .hasMessageContaining("Überprüfung");
        }
    }

    @Test
    void updateStatus_allowed_when_naechsteUeberpruefungAm_is_past() {
        try (MockedStatic<SecurityUtils> sec = mockStatic(SecurityUtils.class)) {
            stubSecurityContext(sec);
            Falleroeffnung fall = openFall();
            when(repo.findByIdWithRefsScoped(FALL_ID, TRAEGER_ID, ORG_UNIT_ID))
                    .thenReturn(Optional.of(fall));

            Meldung meldung = new Meldung();
            meldung.setNaechsteUeberpruefungAm(LocalDate.now().minusDays(1));
            when(meldungRepo.findCurrentByFallId(FALL_ID)).thenReturn(Optional.of(meldung));

            FalleroeffnungService spy = spy(service);
            doReturn(null).when(spy).get(FALL_ID);

            spy.updateStatus(FALL_ID, new UpdateFalleroeffnungStatusRequest("ABGESCHLOSSEN"));

            verify(fall).setStatus(FalleroeffnungStatus.ABGESCHLOSSEN);
        }
    }

    // ── Business rule: AKUT_HEUTE + Gefahr im Verzug blocks ABGESCHLOSSEN ────

    @Test
    void updateStatus_blocked_when_akutHeute_and_gefahrImVerzug() {
        try (MockedStatic<SecurityUtils> sec = mockStatic(SecurityUtils.class)) {
            stubSecurityContext(sec);
            Falleroeffnung fall1 = openFall();
            when(repo.findByIdWithRefsScoped(FALL_ID, TRAEGER_ID, ORG_UNIT_ID))
                    .thenReturn(Optional.of(fall1));

            Meldung meldung1 = new Meldung();
            meldung1.setDringlichkeit(Dringlichkeit.AKUT_HEUTE);
            meldung1.setAkutGefahrImVerzug(true);
            when(meldungRepo.findCurrentByFallId(FALL_ID)).thenReturn(Optional.of(meldung1));

            assertThatThrownBy(() ->
                    service.updateStatus(FALL_ID, new UpdateFalleroeffnungStatusRequest("ABGESCHLOSSEN"))
            )
                    .isInstanceOf(DomainException.class)
                    .hasMessageContaining("Gefahr im Verzug");
        }
    }

    @Test
    void updateStatus_allowed_when_akutHeute_but_no_gefahrImVerzug() {
        // AKUT_HEUTE alone must not block closing
        try (MockedStatic<SecurityUtils> sec = mockStatic(SecurityUtils.class)) {
            stubSecurityContext(sec);
            Falleroeffnung fall = openFall();
            when(repo.findByIdWithRefsScoped(FALL_ID, TRAEGER_ID, ORG_UNIT_ID))
                    .thenReturn(Optional.of(fall));

            Meldung meldung = new Meldung();
            meldung.setDringlichkeit(Dringlichkeit.AKUT_HEUTE);
            meldung.setAkutGefahrImVerzug(false);
            when(meldungRepo.findCurrentByFallId(FALL_ID)).thenReturn(Optional.of(meldung));

            FalleroeffnungService spy = spy(service);
            doReturn(null).when(spy).get(FALL_ID);

            spy.updateStatus(FALL_ID, new UpdateFalleroeffnungStatusRequest("ABGESCHLOSSEN"));

            verify(fall).setStatus(FalleroeffnungStatus.ABGESCHLOSSEN);
        }
    }

    @Test
    void updateStatus_allowed_when_gefahrImVerzug_but_not_akutHeute() {
        // Gefahr im Verzug alone (different dringlichkeit) must not block closing
        try (MockedStatic<SecurityUtils> sec = mockStatic(SecurityUtils.class)) {
            stubSecurityContext(sec);
            Falleroeffnung fall = openFall();
            when(repo.findByIdWithRefsScoped(FALL_ID, TRAEGER_ID, ORG_UNIT_ID))
                    .thenReturn(Optional.of(fall));

            Meldung meldung = new Meldung();
            meldung.setDringlichkeit(Dringlichkeit.ZEITNAH_24_48H);
            meldung.setAkutGefahrImVerzug(true);
            when(meldungRepo.findCurrentByFallId(FALL_ID)).thenReturn(Optional.of(meldung));

            FalleroeffnungService spy = spy(service);
            doReturn(null).when(spy).get(FALL_ID);

            spy.updateStatus(FALL_ID, new UpdateFalleroeffnungStatusRequest("ABGESCHLOSSEN"));

            verify(fall).setStatus(FalleroeffnungStatus.ABGESCHLOSSEN);
        }
    }

    // ── General: cannot reopen an already-closed fall ─────────────────────────

    @Test
    void updateStatus_blocked_when_already_abgeschlossen() {
        try (MockedStatic<SecurityUtils> sec = mockStatic(SecurityUtils.class)) {
            stubSecurityContext(sec);

            Traeger traeger = new Traeger();
            ReflectionTestUtils.setField(traeger, "id", TRAEGER_ID);
            OrgUnit einrichtung = new OrgUnit();
            ReflectionTestUtils.setField(einrichtung, "id", ORG_UNIT_ID);

            Falleroeffnung fall = mock(Falleroeffnung.class);
            when(fall.getId()).thenReturn(FALL_ID);
            when(fall.getStatus()).thenReturn(FalleroeffnungStatus.ABGESCHLOSSEN);
            when(fall.getTraeger()).thenReturn(traeger);
            when(fall.getEinrichtungOrgUnit()).thenReturn(einrichtung);

            when(repo.findByIdWithRefsScoped(FALL_ID, TRAEGER_ID, ORG_UNIT_ID))
                    .thenReturn(Optional.of(fall));

            assertThatThrownBy(() ->
                    service.updateStatus(FALL_ID, new UpdateFalleroeffnungStatusRequest("IN_BEARBEITUNG"))
            ).isInstanceOf(DomainException.class);
        }
    }

    // ── General: no meldung means no blocking ────────────────────────────────

    @Test
    void updateStatus_passesThrough_when_no_current_meldung() {
        try (MockedStatic<SecurityUtils> sec = mockStatic(SecurityUtils.class)) {
            stubSecurityContext(sec);
            Falleroeffnung fall = openFall();
            when(repo.findByIdWithRefsScoped(FALL_ID, TRAEGER_ID, ORG_UNIT_ID))
                    .thenReturn(Optional.of(fall));
            when(meldungRepo.findCurrentByFallId(FALL_ID)).thenReturn(Optional.empty());

            FalleroeffnungService spy = spy(service);
            doReturn(null).when(spy).get(FALL_ID);

            spy.updateStatus(FALL_ID, new UpdateFalleroeffnungStatusRequest("ABGESCHLOSSEN"));

            verify(fall).setStatus(FalleroeffnungStatus.ABGESCHLOSSEN);
            verify(fall).setClosedAt(any());
        }
    }
}
