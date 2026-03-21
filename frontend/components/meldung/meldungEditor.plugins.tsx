/**
 * meldungEditor.plugins.tsx
 * -------------------------
 * Central registry of all companion Bögen (forms) and Assessments used by the
 * MeldungEditor.
 *
 * HOW TO ADD A NEW BOGEN / ASSESSMENT
 * ------------------------------------
 * 1. Create the form-state type and a `defaultState` factory.
 * 2. Implement `loadInitial` – load catalog (if any) + existing record from the
 *    API. Never throw; fall back to `defaultState()` on error.
 * 3. Implement `save` – create-or-update the record via the API.
 * 4. Implement `render` – render the form UI inside its PageCard.
 * 5. Add the plugin object to `COMPANION_BOGEN_PLUGINS` below.
 *
 * That's it. The MeldungEditor will automatically pick it up – no changes to
 * the core component are required.
 */

"use client";

import React from "react";
import { ShieldAlert, CheckCircle2, Building2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

import { kinderschutzbogenApi, type KatalogResponse } from "@/lib/api/kinderschutzbogen";
import { djiApi, type DjiKatalogResponse } from "@/lib/api/dji";
import { schutzplanApi } from "@/lib/api/schutzplan";
import { hausbesuchApi } from "@/lib/api/hausbesuch";

import {
    KinderschutzbogenTabContent,
    type KinderschutzbogenState,
    defaultKinderschutzbogenState,
} from "./KinderschutzbogenTabContent";
import {
    DjiTabContent,
    type DjiFormState,
    defaultDjiFormState,
    initDjiPositionen,
} from "./DjiTabContent";
import { SchutzplanTabContent, type SchutzplanState, defaultSchutzplanState } from "./SchutzplanTabContent";
import { HausbesuchTabContent, type HausbesuchState, defaultHausbesuchState } from "./HausbesuchTabContent";

import { toLocalDate, todayLocalDate } from "./meldungEditor.helpers";
import type { CompanionBogenPlugin } from "./meldungEditor.types";

/* ============================================================================
 * Internal state shapes used by the plugins
 * ========================================================================== */

type KinderschutzbogenPluginState = {
    katalog: KatalogResponse | null;
    katalogLoading: boolean;
    form: KinderschutzbogenState;
};

type DjiPluginState = {
    katalog: DjiKatalogResponse | null;
    katalogLoading: boolean;
    form: DjiFormState;
};

type HausbesuchPluginState = {
    /** Whether the user has opted into filling out the Hausbesuch form. */
    enabled: boolean;
    form: HausbesuchState;
};

/* ============================================================================
 * Mapping helpers (previously inline in MeldungEditor)
 * ========================================================================== */

function mapToKinderschutzbogenRequest(form: KinderschutzbogenState) {
    return {
        bewertungsdatum: form.bewertungsdatum,
        bewertungen: Object.entries(form.bewertungen).map(([itemCode, b]) => ({
            itemCode,
            rating: b.rating,
            notiz: b.notiz || null,
        })),
        gesamteinschaetzungManuell: form.gesamteinschaetzungManuell,
        gesamteinschaetzungFreitext: form.gesamteinschaetzungFreitext || null,
    };
}

function mapToDjiRequest(
    formTyp: "SICHERHEITSEINSCHAETZUNG" | "RISIKOEINSCHAETZUNG",
    form: DjiFormState,
    katalog: DjiKatalogResponse,
) {
    return {
        formTyp,
        bewertungsdatum: form.bewertungsdatum,
        positionen: katalog.positionen.map((item) => {
            const state = form.positionen[item.code];
            return {
                positionCode: item.code,
                belege: state?.belege || undefined,
                bewertungBool: item.bewertungstyp === "BOOLEAN_MIT_BELEGE" ? state?.bewertungBool ?? null : undefined,
                bewertungStufe: item.bewertungstyp === "SECHSSTUFEN" ? state?.bewertungStufe ?? null : undefined,
            };
        }),
        gesamteinschaetzung: form.gesamteinschaetzung,
        gesamtfreitext: form.gesamtfreitext || null,
    };
}

function mapToSchutzplanRequest(form: SchutzplanState) {
    return {
        erstelltAm: form.erstelltAm,
        gueltigBis: toLocalDate(form.gueltigBis),
        status: form.status || "AKTIV",
        gefaehrdungssituation: form.gefaehrdungssituation || null,
        vereinbarungen: form.vereinbarungen || null,
        beteiligte: form.beteiligte || null,
        naechsterTermin: toLocalDate(form.naechsterTermin),
        gesamtfreitext: form.gesamtfreitext || null,
        massnahmen: form.massnahmen
            .filter((m) => String(m.massnahme ?? "").trim())
            .map((m) => ({
                massnahme: m.massnahme,
                verantwortlich: m.verantwortlich || undefined,
                bisDatum: toLocalDate(m.bisDatum),
                status: m.status,
            })),
    };
}

function mapToHausbesuchRequest(form: HausbesuchState) {
    return {
        besuchsdatum: form.besuchsdatum,
        besuchszeitVon: form.besuchszeitVon || null,
        besuchszeitBis: form.besuchszeitBis || null,
        anwesende: form.anwesende || null,
        whgOrdnung: form.whgOrdnung || null,
        whgHygiene: form.whgHygiene || null,
        whgNahrungsversorgung: form.whgNahrungsversorgung || null,
        whgUnfallgefahren: form.whgUnfallgefahren || null,
        whgSonstiges: form.whgSonstiges || null,
        kindErscheinungsbild: form.kindErscheinungsbild || null,
        kindVerhalten: form.kindVerhalten || null,
        kindStimmung: form.kindStimmung || null,
        kindAeusserungen: form.kindAeusserungen || null,
        kindHinweiseGefaehrdung: form.kindHinweiseGefaehrdung || null,
        bpErscheinungsbild: form.bpErscheinungsbild || null,
        bpVerhalten: form.bpVerhalten || null,
        bpUmgangKind: form.bpUmgangKind || null,
        bpKooperation: form.bpKooperation || null,
        einschaetzungAmpel: form.einschaetzungAmpel,
        einschaetzungText: form.einschaetzungText || null,
        naechsteSchritte: form.naechsteSchritte || null,
        naechsterTermin: toLocalDate(form.naechsterTermin),
    };
}

/* ============================================================================
 * Plugin: Stuttgarter Kinderschutzbogen
 * ========================================================================== */

export const kinderschutzbogenPlugin: CompanionBogenPlugin<KinderschutzbogenPluginState> = {
    key: "kinderschutzbogen",
    label: "Stuttgarter Kinderschutzbogen",
    step: "einschaetzung",
    icon: <ShieldAlert className="h-4 w-4 text-brand-text2" />,

    defaultState: () => ({
        katalog: null,
        katalogLoading: true,
        form: defaultKinderschutzbogenState(),
    }),

    loadInitial: async (fallId) => {
        let katalog: KatalogResponse | null = null;
        let form = defaultKinderschutzbogenState();
        let id: number | null = null;

        try {
            katalog = await kinderschutzbogenApi.katalog(fallId);
            const init: KinderschutzbogenState["bewertungen"] = {};
            katalog.items.forEach((item) => {
                init[item.code] = { rating: null, notiz: "" };
            });
            form = { ...form, bewertungen: init };
        } catch {
            // catalog unavailable – render with empty catalog
        }

        try {
            const list = await (kinderschutzbogenApi.list?.(fallId).catch(() => []) ?? []);
            const item = Array.isArray(list) && list.length ? list[0] : null;
            if (item?.id && kinderschutzbogenApi.get) {
                const ksb = await kinderschutzbogenApi.get(fallId, item.id).catch(() => null);
                if (ksb) {
                    const bewertungen: KinderschutzbogenState["bewertungen"] = {};
                    ksb.bewertungen.forEach((b) => {
                        bewertungen[b.itemCode] = { rating: b.rating ?? null, notiz: b.notiz ?? "" };
                    });
                    form = {
                        bewertungsdatum: ksb.bewertungsdatum ?? todayLocalDate(),
                        bewertungen,
                        gesamteinschaetzungManuell: ksb.gesamteinschaetzungManuell ?? null,
                        gesamteinschaetzungFreitext: ksb.gesamteinschaetzungFreitext ?? "",
                    };
                    id = item.id;
                }
            }
        } catch {
            // no existing data – use defaults
        }

        return { id, state: { katalog, katalogLoading: false, form } };
    },

    save: async (fallId, id, { form, katalog }) => {
        if (!katalog) return id ?? 0; // no catalog loaded – skip silently
        const req = mapToKinderschutzbogenRequest(form);
        if (id) {
            await kinderschutzbogenApi.update(fallId, id, req);
            return id;
        }
        const result = await kinderschutzbogenApi.create(fallId, req);
        return result.id;
    },

    render: ({ state, onChange, disabled }) => (
        <KinderschutzbogenTabContent
            katalog={state.katalog}
            katalogLoading={state.katalogLoading}
            form={state.form}
            onChange={(form) => onChange({ ...state, form })}
            disabled={disabled}
        />
    ),
};

/* ============================================================================
 * Factory: DJI Assessments (reusable for any DJI form type)
 * ========================================================================== */

function createDjiPlugin(
    formTyp: "SICHERHEITSEINSCHAETZUNG" | "RISIKOEINSCHAETZUNG",
): CompanionBogenPlugin<DjiPluginState> {
    const isRisiko = formTyp === "RISIKOEINSCHAETZUNG";
    return {
        key: isRisiko ? "djiRisiko" : "djiSicherheit",
        label: isRisiko ? "DJI · Risikoeinschätzung" : "DJI · Sicherheitseinschätzung",
        step: "einschaetzung",
        icon: <ShieldAlert className="h-4 w-4 text-brand-text2" />,

        defaultState: () => ({ katalog: null, katalogLoading: true, form: defaultDjiFormState() }),

        loadInitial: async (fallId) => {
            let katalog: DjiKatalogResponse | null = null;
            let form = defaultDjiFormState();
            let id: number | null = null;

            try {
                katalog = await djiApi.katalog(fallId, formTyp);
                form = { ...form, positionen: initDjiPositionen(katalog) };
            } catch {
                // catalog unavailable
            }

            try {
                const list = await (djiApi.list?.(fallId).catch(() => []) ?? []);
                const item = Array.isArray(list)
                    ? (list.find((x) => String(x.formTyp ?? "").toUpperCase() === formTyp) ?? null)
                    : null;
                if (item?.id && djiApi.get) {
                    const dji = await djiApi.get(fallId, item.id).catch(() => null);
                    if (dji) {
                        form = {
                            bewertungsdatum: dji.bewertungsdatum ?? todayLocalDate(),
                            gesamteinschaetzung: dji.gesamteinschaetzung ?? null,
                            gesamtfreitext: dji.gesamtfreitext ?? "",
                            positionen: Object.fromEntries(
                                dji.positionen.map((p) => [
                                    p.positionCode,
                                    {
                                        belege: p.belege ?? "",
                                        bewertungBool: p.bewertungBool ?? null,
                                        bewertungStufe: p.bewertungStufe ?? null,
                                        open: true,
                                    },
                                ]),
                            ),
                        };
                        id = item.id;
                    }
                }
            } catch {
                // no existing data
            }

            return { id, state: { katalog, katalogLoading: false, form } };
        },

        save: async (fallId, id, { form, katalog }) => {
            if (!katalog) return id ?? 0;
            const req = mapToDjiRequest(formTyp, form, katalog);
            if (id) {
                await djiApi.update(fallId, id, req);
                return id;
            }
            const result = await djiApi.create(fallId, req);
            return result.id;
        },

        render: ({ state, onChange, disabled }) => (
            <DjiTabContent
                katalog={state.katalog}
                katalogLoading={state.katalogLoading}
                form={state.form}
                onChange={(form) => onChange({ ...state, form })}
                disabled={disabled}
            />
        ),
    };
}

export const djiSicherheitPlugin = createDjiPlugin("SICHERHEITSEINSCHAETZUNG");
export const djiRisikoPlugin = createDjiPlugin("RISIKOEINSCHAETZUNG");

/* ============================================================================
 * Plugin: Schutzplan
 * ========================================================================== */

export const schutzplanPlugin: CompanionBogenPlugin<SchutzplanState> = {
    key: "schutzplan",
    label: "Schutzplan",
    step: "massnahmen",
    icon: <CheckCircle2 className="h-4 w-4 text-brand-text2" />,

    defaultState: defaultSchutzplanState,

    loadInitial: async (fallId) => {
        try {
            const list = await (schutzplanApi.list?.(fallId).catch(() => []) ?? []);
            const item = Array.isArray(list) && list.length ? list[0] : null;
            if (item?.id && schutzplanApi.get) {
                const sp = await schutzplanApi.get(fallId, item.id).catch(() => null);
                if (sp) {
                    return {
                        id: item.id,
                        state: {
                            erstelltAm: sp.erstelltAm ?? todayLocalDate(),
                            gueltigBis: sp.gueltigBis ?? "",
                            status: sp.status ?? "AKTIV",
                            gefaehrdungssituation: sp.gefaehrdungssituation ?? "",
                            vereinbarungen: sp.vereinbarungen ?? "",
                            beteiligte: sp.beteiligte ?? "",
                            naechsterTermin: sp.naechsterTermin ?? "",
                            gesamtfreitext: sp.gesamtfreitext ?? "",
                            massnahmen:
                                Array.isArray(sp.massnahmen) && sp.massnahmen.length
                                    ? sp.massnahmen.map((m) => ({
                                          massnahme: m.massnahme ?? "",
                                          verantwortlich: m.verantwortlich ?? "",
                                          bisDatum: m.bisDatum ?? "",
                                          status: m.status ?? "OFFEN",
                                      }))
                                    : defaultSchutzplanState().massnahmen,
                        },
                    };
                }
            }
        } catch {
            // no existing data
        }
        return { id: null, state: defaultSchutzplanState() };
    },

    save: async (fallId, id, state) => {
        const req = mapToSchutzplanRequest(state);
        if (id) {
            await schutzplanApi.update(fallId, id, req);
            return id;
        }
        const result = await schutzplanApi.create(fallId, req);
        return result.id;
    },

    render: ({ state, onChange, disabled }) => (
        <SchutzplanTabContent form={state} onChange={onChange} disabled={disabled} />
    ),
};

/* ============================================================================
 * Plugin: Hausbesuch / Elterngespräch
 *
 * This plugin is opt-in: the user must explicitly activate it via the toggle
 * rendered inside the plugin's card. The `isEnabled` check ensures the form is
 * only persisted when the user has opted in.
 * ========================================================================== */

export const hausbesuchPlugin: CompanionBogenPlugin<HausbesuchPluginState> = {
    key: "hausbesuch",
    label: "Hausbesuch",
    step: "massnahmen",
    icon: <Building2 className="h-4 w-4 text-brand-text2" />,

    defaultState: () => ({ enabled: false, form: defaultHausbesuchState() }),

    isEnabled: ({ state }) => state.enabled,

    loadInitial: async (fallId) => {
        try {
            const list = await (hausbesuchApi.list?.(fallId).catch(() => []) ?? []);
            const item = Array.isArray(list) && list.length ? list[0] : null;
            if (item?.id && hausbesuchApi.get) {
                const hb = await hausbesuchApi.get(fallId, item.id).catch(() => null);
                if (hb) {
                    return {
                        id: item.id,
                        state: {
                            enabled: true,
                            form: {
                                besuchsdatum: hb.besuchsdatum ?? todayLocalDate(),
                                besuchszeitVon: hb.besuchszeitVon ?? "",
                                besuchszeitBis: hb.besuchszeitBis ?? "",
                                anwesende: hb.anwesende ?? "",
                                whgOrdnung: hb.whgOrdnung ?? "",
                                whgHygiene: hb.whgHygiene ?? "",
                                whgNahrungsversorgung: hb.whgNahrungsversorgung ?? "",
                                whgUnfallgefahren: hb.whgUnfallgefahren ?? "",
                                whgSonstiges: hb.whgSonstiges ?? "",
                                kindErscheinungsbild: hb.kindErscheinungsbild ?? "",
                                kindVerhalten: hb.kindVerhalten ?? "",
                                kindStimmung: hb.kindStimmung ?? "",
                                kindAeusserungen: hb.kindAeusserungen ?? "",
                                kindHinweiseGefaehrdung: hb.kindHinweiseGefaehrdung ?? "",
                                bpErscheinungsbild: hb.bpErscheinungsbild ?? "",
                                bpVerhalten: hb.bpVerhalten ?? "",
                                bpUmgangKind: hb.bpUmgangKind ?? "",
                                bpKooperation: hb.bpKooperation ?? "",
                                einschaetzungAmpel: hb.einschaetzungAmpel ?? "GELB",
                                einschaetzungText: hb.einschaetzungText ?? "",
                                naechsteSchritte: hb.naechsteSchritte ?? "",
                                naechsterTermin: hb.naechsterTermin ?? "",
                            },
                        },
                    };
                }
            }
        } catch {
            // no existing data
        }
        return { id: null, state: { enabled: false, form: defaultHausbesuchState() } };
    },

    save: async (fallId, id, { form }) => {
        const req = mapToHausbesuchRequest(form);
        if (id) {
            await hausbesuchApi.update(fallId, id, req);
            return id;
        }
        const result = await hausbesuchApi.create(fallId, req);
        return result.id;
    },

    render: ({ state, onChange, disabled }) => (
        <div className="space-y-3">
            <div
                className={`rounded-2xl border p-3 flex items-center justify-between ${
                    state.enabled ? "border-blue-300 bg-blue-50" : "border-brand-border/25 bg-white"
                }`}
            >
                <div className="min-w-0">
                    <div className={`text-sm font-semibold ${state.enabled ? "text-blue-800" : "text-brand-text"}`}>
                        Hausbesuch / Elterngespräch zu Hause
                    </div>
                    <div className="text-xs text-brand-text2 mt-0.5">
                        Aktivieren, um das Protokoll als Teil desselben Prozesses auszufüllen.
                    </div>
                </div>
                <Switch
                    checked={state.enabled}
                    onCheckedChange={(v) => onChange({ ...state, enabled: v })}
                    disabled={disabled}
                />
            </div>
            {state.enabled ? (
                <HausbesuchTabContent
                    form={state.form}
                    onChange={(form) => onChange({ ...state, form })}
                    disabled={disabled}
                />
            ) : null}
        </div>
    ),
};

/* ============================================================================
 * Master registry – the MeldungEditor iterates this list.
 *
 * Add new plugins here (in the desired display order within each step).
 * ========================================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const COMPANION_BOGEN_PLUGINS: CompanionBogenPlugin<any>[] = [
    kinderschutzbogenPlugin,
    djiSicherheitPlugin,
    djiRisikoPlugin,
    schutzplanPlugin,
    hausbesuchPlugin,
];
