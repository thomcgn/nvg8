"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Briefcase, Plus, Users } from "lucide-react";

import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

import type {
    AddKindBezugspersonRequest,
    BezugspersonBeziehung,
    KindBezugspersonResponse,
    KindResponse,
    SorgerechtTyp,
    CreateFalleroeffnungRequest,
    FalleroeffnungResponse,
    Gender,
} from "@/lib/types";

const BEZIEHUNGEN: BezugspersonBeziehung[] = [
    "MUTTER",
    "VATER",
    "SORGEBERECHTIGT",
    "PFLEGEMUTTER",
    "PFLEGEVATER",
    "STIEFMUTTER",
    "STIEFVATER",
    "GROSSMUTTER",
    "GROSSVATER",
    "SONSTIGE",
];

const SORGERECHT: SorgerechtTyp[] = [
    "UNGEKLAERT",
    "GEMEINSAM",
    "ALLEIN",
    "KEIN",
    "AMTSPFLEGSCHAFT",
    "VORMUNDSCHAFT",
];

const GENDERS: Gender[] = ["UNBEKANNT", "MAENNLICH", "WEIBLICH", "DIVERS"];

function kindDisplayName(k: KindResponse | null) {
    if (!k) return "Kind";
    return `${k.vorname ?? ""} ${k.nachname ?? ""}`.trim() || `Kind #${k.id}`;
}

export default function KindDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = Number(params.id);

    const { me } = useAuth();

    const [kind, setKind] = useState<KindResponse | null>(null);
    const [bps, setBps] = useState<KindBezugspersonResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // Modal state
    const [open, setOpen] = useState(false);
    const [bez, setBez] = useState<BezugspersonBeziehung>("MUTTER");
    const [sorg, setSorg] = useState<SorgerechtTyp>("UNGEKLAERT");
    const [haupt, setHaupt] = useState(true);
    const [haushalt, setHaushalt] = useState(true);

    const [vorname, setVorname] = useState("");
    const [nachname, setNachname] = useState("");
    const [geburtsdatum, setGeburtsdatum] = useState("");
    const [gender, setGender] = useState<Gender>("UNBEKANNT");
    const [telefon, setTelefon] = useState("");
    const [kontaktEmail, setKontaktEmail] = useState("");

    async function reload() {
        setErr(null);
        setLoading(true);
        try {
            const k = await apiFetch<KindResponse>(`/kinder/${id}`, { method: "GET" });
            const list = await apiFetch<KindBezugspersonResponse[]>(`/kinder/${id}/bezugspersonen`, { method: "GET" });
            setKind(k);
            setBps((list || []).filter((x) => x.enabled));
        } catch (e: any) {
            setErr(e?.message || "Konnte Kind/Bezugspersonen nicht laden.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!id) return;
        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const title = useMemo(() => kindDisplayName(kind), [kind]);

    async function startAkte() {
        setErr(null);

        // wir brauchen EINRICHTUNG context id für CreateFalleroeffnungRequest
        const einrichtungOrgUnitId = me?.orgUnitId;
        if (!einrichtungOrgUnitId) {
            setErr("Kein aktiver Einrichtungskontext gesetzt (me.orgUnitId fehlt). Bitte neu einloggen/Context wählen.");
            return;
        }

        setLoading(true);
        try {
            const payload: CreateFalleroeffnungRequest = {
                kindId: id,
                einrichtungOrgUnitId,
                titel: `Akte: ${title}`,
                kurzbeschreibung: null,
            };

            const created = await apiFetch<FalleroeffnungResponse>("/falloeffnungen", {
                method: "POST",
                body: payload,
            });

            // falls du eine Detailroute hast, nimm sie:
            // router.push(`/dashboard/falloeffnungen/${created.id}`);
            router.push("/dashboard/falloeffnungen");
        } catch (e: any) {
            setErr(e?.message || "Akte konnte nicht gestartet werden.");
        } finally {
            setLoading(false);
        }
    }

    async function addBezugsperson() {
        setErr(null);

        if (!vorname.trim() || !nachname.trim()) {
            setErr("Vorname und Nachname sind Pflicht.");
            return;
        }

        setLoading(true);
        try {
            const payload: AddKindBezugspersonRequest = {
                create: {
                    vorname: vorname.trim(),
                    nachname: nachname.trim(),
                    geburtsdatum: geburtsdatum ? geburtsdatum : null,
                    gender,
                    telefon: telefon.trim() || null,
                    kontaktEmail: kontaktEmail.trim() || null,
                },
                beziehung: bez,
                sorgerecht: sorg,
                validFrom: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
                hauptkontakt: haupt,
                lebtImHaushalt: haushalt,
            };

            await apiFetch(`/kinder/${id}/bezugspersonen`, {
                method: "POST",
                body: payload,
            });

            setOpen(false);

            // reset minimal
            setVorname("");
            setNachname("");
            setGeburtsdatum("");
            setTelefon("");
            setKontaktEmail("");

            await reload();
        } catch (e: any) {
            setErr(e?.message || "Bezugsperson konnte nicht hinzugefügt werden.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title={title} />

                <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6 md:px-8 space-y-4">
                    {err ? (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                            {err}
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Button className="gap-2" onClick={startAkte} disabled={loading}>
                            <Briefcase className="h-4 w-4" />
                            Akte starten
                        </Button>

                        <Button variant="secondary" className="gap-2" onClick={() => setOpen(true)} disabled={loading}>
                            <Plus className="h-4 w-4" />
                            Bezugsperson ergänzen
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="text-sm font-semibold text-brand-text">Kind</div>
                            <div className="mt-1 text-xs text-brand-text2">Stammdaten</div>
                        </CardHeader>
                        <CardContent className="text-sm text-brand-text2 space-y-2">
                            <div>
                                <span className="font-semibold text-brand-text">Geburtsdatum:</span> {kind?.geburtsdatum ?? "—"}
                            </div>
                            <div>
                                <span className="font-semibold text-brand-text">Gender:</span> {kind?.gender ?? "—"}
                            </div>
                            <div>
                                <span className="font-semibold text-brand-text">Förderbedarf:</span>{" "}
                                {kind ? (kind.foerderbedarf ? "Ja" : "Nein") : "—"}
                            </div>
                            {kind?.foerderbedarfDetails ? (
                                <div>
                                    <span className="font-semibold text-brand-text">Details:</span> {kind.foerderbedarfDetails}
                                </div>
                            ) : null}
                            {kind?.gesundheitsHinweise ? (
                                <div>
                                    <span className="font-semibold text-brand-text">Hinweise:</span> {kind.gesundheitsHinweise}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-brand-text2" />
                                <div>
                                    <div className="text-sm font-semibold text-brand-text">Bezugspersonen</div>
                                    <div className="mt-1 text-xs text-brand-text2">
                                        <code className="rounded bg-brand-bg px-1">GET /kinder/{id}/bezugspersonen</code>
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-brand-text2">{loading ? "…" : `${bps.length} aktiv`}</div>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-2">
                                {bps.map((bp) => (
                                    <div key={bp.linkId} className="rounded-2xl border border-brand-border bg-white p-3">
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-brand-blue whitespace-normal break-words">
                                                {bp.bezugspersonName}
                                                {bp.hauptkontakt ? <span className="ml-2 text-xs text-brand-text2">(Hauptkontakt)</span> : null}
                                            </div>
                                            <div className="mt-1 text-xs text-brand-text2 whitespace-normal break-words">
                                                {bp.beziehung}
                                                {bp.sorgerecht ? ` · Sorgerecht: ${bp.sorgerecht}` : ""}
                                                {bp.lebtImHaushalt ? " · im Haushalt" : ""}
                                                {bp.validFrom ? ` · ab ${bp.validFrom}` : ""}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {!bps.length ? (
                                    <div className="rounded-2xl border border-brand-border bg-brand-bg p-4 text-sm text-brand-text2">
                                        Keine aktiven Bezugspersonen hinterlegt.
                                    </div>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Modal open={open} title="Bezugsperson ergänzen" onClose={() => setOpen(false)}>
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <div className="mb-1 text-xs font-semibold text-brand-text2">Beziehung</div>
                                <select
                                    value={bez}
                                    onChange={(e) => setBez(e.target.value as BezugspersonBeziehung)}
                                    className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                >
                                    {BEZIEHUNGEN.map((x) => (
                                        <option key={x} value={x}>
                                            {x}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="mb-1 text-xs font-semibold text-brand-text2">Sorgerecht</div>
                                <select
                                    value={sorg}
                                    onChange={(e) => setSorg(e.target.value as SorgerechtTyp)}
                                    className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                >
                                    {SORGERECHT.map((x) => (
                                        <option key={x} value={x}>
                                            {x}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Input label="Vorname *" value={vorname} onChange={(e) => setVorname(e.target.value)} />
                            <Input label="Nachname *" value={nachname} onChange={(e) => setNachname(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <div className="mb-1 text-xs font-semibold text-brand-text2">Geburtsdatum</div>
                                <input
                                    type="date"
                                    value={geburtsdatum}
                                    onChange={(e) => setGeburtsdatum(e.target.value)}
                                    className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                />
                            </div>

                            <div>
                                <div className="mb-1 text-xs font-semibold text-brand-text2">Gender</div>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value as Gender)}
                                    className="h-10 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                >
                                    {GENDERS.map((g) => (
                                        <option key={g} value={g}>
                                            {g}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Input label="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
                            <Input label="E-Mail" value={kontaktEmail} onChange={(e) => setKontaktEmail(e.target.value)} />
                        </div>

                        <div className="flex flex-wrap gap-4 pt-1 text-sm text-brand-text">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={haupt} onChange={(e) => setHaupt(e.target.checked)} className="h-4 w-4" />
                                Hauptkontakt
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={haushalt} onChange={(e) => setHaushalt(e.target.checked)} className="h-4 w-4" />
                                lebt im Haushalt
                            </label>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
                                Abbrechen
                            </Button>
                            <Button onClick={addBezugsperson} disabled={loading || !vorname.trim() || !nachname.trim()}>
                                Speichern
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AuthGate>
    );
}