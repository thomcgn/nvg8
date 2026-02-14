"use client";

import { useEffect, useMemo, useState } from "react";

import PersonFields, { emptyPerson, PersonBase } from "@/app/components/PersonFields";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type {KindResponse, KindSummary, BezugspersonResponse, BezugspersonSummary} from "@/lib/types";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CaseWizardProps {
    onCancel: () => void;
}

// Enum-Werte passend zu deinem Backend: RolleImAlltag
// ⚠️ Falls dein Backend andere Enum-Namen hat, hier anpassen.
const ROLLEN_IM_ALLTAG = [
    "ELTERNTEIL",
    "PFLEGEFAMILIE",
    "BETREUUNG",
    "FAMILIENHILFE",
    "EINRICHTUNG",
    "SONSTIGE",
] as const;

type RolleImAlltag = (typeof ROLLEN_IM_ALLTAG)[number];

async function readBodySafe(res: Response) {
    const text = await res.text().catch(() => "");
    return { text };
}

// Hilfsfunktionen: Response -> Summary
function kindSummaryFromCreate(res: KindResponse): KindSummary {
    const p = res?.person ?? {};
    return {
        id: res.id,
        vorname: p.vorname ?? "",
        nachname: p.nachname ?? "",
        geburtsdatum: res.geburtsdatum ?? undefined,
    };
}

function bpSummaryFromCreate(res: BezugspersonResponse): BezugspersonSummary {
    const p = res?.person ?? {};
    return {
        id: res.id,
        vorname: p.vorname ?? "",
        nachname: p.nachname ?? "",
        organisation: res.organisation ?? undefined,
    };
}

export default function CaseWizard({ onCancel }: CaseWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [kinder, setKinder] = useState<KindSummary[]>([]);
    const [selectedKind, setSelectedKind] = useState<number | null>(null);

    const [bezugspersonen, setBezugspersonen] = useState<BezugspersonSummary[]>([]);
    const [selectedBezugspersonIds, setSelectedBezugspersonIds] = useState<number[]>([]);

    // Rolle pro Bezugsperson (für Relation)
    const [rolleByBezugspersonId, setRolleByBezugspersonId] = useState<Record<number, RolleImAlltag>>({});

    // Create Kind UI
    const [showCreateKind, setShowCreateKind] = useState(false);
    const [creatingKind, setCreatingKind] = useState(false);
    const [newKind, setNewKind] = useState<PersonBase>(emptyPerson);
    const [newKindGeburtsdatum, setNewKindGeburtsdatum] = useState<string>("");

    // Create Bezugsperson UI
    const [showCreateBp, setShowCreateBp] = useState(false);
    const [creatingBp, setCreatingBp] = useState(false);
    const [newBp, setNewBp] = useState<PersonBase>(emptyPerson);

    // Default Rolle für neu hinzukommende/zugeordnete Bezugsperson
    const [newRelationRole, setNewRelationRole] = useState<RolleImAlltag>("ELTERNTEIL");

    const [description, setDescription] = useState("");
    const [submittingDraft, setSubmittingDraft] = useState(false);

    const progressValue = (step / 3) * 100;

    const kindLabel = (k: KindSummary) =>
        `${k.vorname ?? ""} ${k.nachname ?? ""}`.trim() || `Kind #${k.id}`;

    const bpLabel = (p: BezugspersonSummary) =>
        `${p.vorname ?? ""} ${p.nachname ?? ""}`.trim() || `Bezugsperson #${p.id}`;

    const selectedKindObj = useMemo(
        () => kinder.find((k) => k.id === selectedKind) ?? null,
        [kinder, selectedKind]
    );

    const nextStep = () => setStep((prev) => (prev < 3 ? ((prev + 1) as any) : prev));
    const prevStep = () => setStep((prev) => (prev > 1 ? ((prev - 1) as any) : prev));

    useEffect(() => {
        const loadAll = async () => {
            try {
                const [kRes, bRes] = await Promise.all([
                    fetch("/api/cases/kinder", { credentials: "include", cache: "no-store" }),
                    fetch("/api/cases/erziehungspersonen", { credentials: "include", cache: "no-store" }),
                ]);

                if (!kRes.ok) {
                    const { text } = await readBodySafe(kRes);
                    throw new Error(`GET /kinder failed: ${kRes.status} ${text}`);
                }
                if (!bRes.ok) {
                    const { text } = await readBodySafe(bRes);
                    throw new Error(`GET /erziehungspersonen failed: ${bRes.status} ${text}`);
                }

                const kinderJson = (await kRes.json()) as KindSummary[];
                const bpJson = (await bRes.json()) as BezugspersonSummary[];

                setKinder(kinderJson);
                setBezugspersonen(bpJson);
            } catch (e: any) {
                console.error("[Wizard] loadAll error:", e);
                toast.error("Laden fehlgeschlagen", {
                    description: e?.message || "Kinder oder Bezugspersonen konnten nicht geladen werden.",
                });
            }
        };

        loadAll();
    }, []);

    const resetCreateKindForm = () => {
        setNewKind(emptyPerson);
        setNewKindGeburtsdatum("");
        setSelectedBezugspersonIds([]);
        setRolleByBezugspersonId({});
    };

    const resetCreateBpForm = () => {
        setNewBp(emptyPerson);
        setNewRelationRole("ELTERNTEIL");
    };

    const ensureRoleDefault = (id: number, fallback: RolleImAlltag = "SONSTIGE") => {
        setRolleByBezugspersonId((prev) => ({
            ...prev,
            [id]: prev[id] ?? fallback,
        }));
    };

    const toggleSelectedBp = (id: number) => {
        setSelectedBezugspersonIds((prev) => {
            const isSelected = prev.includes(id);
            const next = isSelected ? prev.filter((x) => x !== id) : [...prev, id];

            if (!isSelected) ensureRoleDefault(id, "ELTERNTEIL");

            if (isSelected) {
                setRolleByBezugspersonId((rprev) => {
                    const copy = { ...rprev };
                    delete copy[id];
                    return copy;
                });
            }

            return next;
        });
    };

    const createBezugsperson = async ({ keepOpen }: { keepOpen: boolean }) => {
        if (!newBp.vorname?.trim() || !newBp.nachname?.trim()) {
            toast.error("Pflichtfelder fehlen", {
                description: "Bitte Vorname und Nachname der Bezugsperson ausfüllen.",
            });
            return;
        }

        setCreatingBp(true);
        try {
            // Backend erwartet BezugspersonCreateRequest:
            // vorname, nachname, adresse..., telefon, email/kontaktEmail, plus meta-felder
            // PersonFields liefert PersonBase -> wir schicken es 1:1 (wie bisher).
            const payload = { ...newBp };

            const res = await fetch("/api/cases/erziehungspersonen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const { text } = await readBodySafe(res);
            if (!res.ok) throw new Error(`Fehler beim Anlegen (${res.status}) ${text}`);

            const created = JSON.parse(text) as BezugspersonResponse;

            // Summary-Liste aktualisieren (für Auswahl)
            const createdSummary = bpSummaryFromCreate(created);
            setBezugspersonen((prev) => [createdSummary, ...prev]);

            // automatisch auswählen + Rolle für Relation setzen
            setSelectedBezugspersonIds((prev) => (prev.includes(createdSummary.id) ? prev : [...prev, createdSummary.id]));
            setRolleByBezugspersonId((prev) => ({
                ...prev,
                [createdSummary.id]: newRelationRole,
            }));

            toast.success("Bezugsperson angelegt", {
                description: `${bpLabel(createdSummary)} wurde hinzugefügt und ausgewählt (${newRelationRole}).`,
            });

            resetCreateBpForm();
            setShowCreateBp(keepOpen);
        } catch (err: any) {
            console.error("[Wizard] createBezugsperson error:", err);
            toast.error("Anlegen fehlgeschlagen", {
                description: err?.message || "Unbekannter Fehler beim Anlegen der Bezugsperson.",
            });
        } finally {
            setCreatingBp(false);
        }
    };

    const createKind = async () => {
        if (!newKind.vorname?.trim() || !newKind.nachname?.trim()) {
            toast.error("Pflichtfelder fehlen", {
                description: "Bitte Vorname und Nachname des Kindes ausfüllen.",
            });
            return;
        }

        if (!newKindGeburtsdatum) {
            toast.error("Geburtsdatum fehlt", { description: "Bitte Geburtsdatum angeben." });
            return;
        }

        if (selectedBezugspersonIds.length === 0) {
            toast.error("Zuordnung fehlt", { description: "Ein Kind benötigt mindestens eine Bezugsperson." });
            return;
        }

        const missingRole = selectedBezugspersonIds.find((id) => !rolleByBezugspersonId[id]);
        if (missingRole) {
            toast.error("Rolle fehlt", {
                description: "Bitte für jede ausgewählte Bezugsperson eine Rolle (im Alltag) wählen.",
            });
            return;
        }

        setCreatingKind(true);
        try {
            // Backend erwartet CreateKindRequest:
            // vorname, nachname, geburtsdatum, person-felder..., bezugspersonen [{id, rolleImAlltag}]
            const payload = {
                ...newKind,
                geburtsdatum: newKindGeburtsdatum,
                bezugspersonen: selectedBezugspersonIds.map((id) => ({
                    id,
                    rolleImAlltag: rolleByBezugspersonId[id] ?? "SONSTIGE",
                })),
            };

            const res = await fetch("/api/cases/kinder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const { text } = await readBodySafe(res);
            if (!res.ok) throw new Error(`Fehler beim Anlegen (${res.status}) ${text}`);

            const created = JSON.parse(text) as KindResponse;

            const createdSummary = kindSummaryFromCreate(created);

            setKinder((prev) => {
                const next = [createdSummary, ...prev];
                const seen = new Set<number>();
                return next.filter((k) => {
                    if (k?.id == null) return true;
                    if (seen.has(k.id)) return false;
                    seen.add(k.id);
                    return true;
                });
            });

            setSelectedKind(createdSummary.id);

            resetCreateKindForm();
            setShowCreateKind(false);
            setShowCreateBp(false);

            toast.success("Kind angelegt", {
                description: `${kindLabel(createdSummary)} wurde erstellt und ausgewählt.`,
            });
        } catch (err: any) {
            console.error("[Wizard] createKind error:", err);
            toast.error("Anlegen fehlgeschlagen", {
                description: err?.message || "Unbekannter Fehler beim Anlegen des Kindes.",
            });
        } finally {
            setCreatingKind(false);
        }
    };

    const validateBeforeNext = () => {
        if (step === 1) {
            if (!selectedKind) {
                toast.error("Kind fehlt", { description: "Bitte ein Kind auswählen (oder anlegen)." });
                return false;
            }
        }
        if (step === 2) {
            if (!description.trim()) {
                toast.error("Beschreibung fehlt", {
                    description: "Bitte eine kurze Beobachtung / Einschätzung eintragen.",
                });
                return false;
            }
        }
        return true;
    };

    const onNext = () => {
        if (!validateBeforeNext()) return;
        nextStep();
    };

    const createDraft = async () => {
        if (!selectedKind) {
            toast.error("Kind fehlt", { description: "Bitte ein Kind auswählen." });
            return;
        }

        if (!description.trim()) {
            toast.error("Beschreibung fehlt", { description: "Bitte eine Beschreibung eingeben." });
            return;
        }

        setSubmittingDraft(true);
        try {
            // defensiv: falls Backend DraftRequest nur {kindId} hat
            const payload: any = { kindId: selectedKind };
            // nur mitsenden, wenn Backend es akzeptiert (falls es später eingebaut wird)
            payload.description = description;

            const res = await fetch("/api/cases/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const { text } = await readBodySafe(res);
            if (!res.ok) throw new Error(`Fehler beim Erstellen (${res.status}) ${text}`);

            const draft = JSON.parse(text);
            toast.success("Draft-Fall erstellt", {
                description: `ID: ${draft?.id ?? "–"}`,
            });

            onCancel();
        } catch (err: any) {
            console.error("[Wizard] createDraft error:", err);
            toast.error("Erstellen fehlgeschlagen", {
                description: err?.message || "Unbekannter Fehler beim Erstellen des Draft-Falls.",
            });
        } finally {
            setSubmittingDraft(false);
        }
    };

    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Neuen Fall anlegen</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                    <Progress value={progressValue} />
                    <div className="text-sm text-muted-foreground">
                        Schritt <span className="font-medium text-foreground">{step}</span> von 3
                    </div>
                </div>

                <Separator />

                {/* STEP 1 */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-semibold">Kind auswählen</h3>
                            <Badge variant="outline">Stammdaten</Badge>
                        </div>

                        {/* Select Kind */}
                        <div className="space-y-2">
                            <Label>Kind</Label>
                            <Select
                                value={selectedKind ? String(selectedKind) : ""}
                                onValueChange={(v) => setSelectedKind(v ? Number(v) : null)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="-- Bitte auswählen --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {kinder.map((k) => (
                                        <SelectItem key={`kind-${k.id}`} value={String(k.id)}>
                                            {kindLabel(k)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button variant="link" className="px-0" onClick={() => setShowCreateKind((v) => !v)}>
                            {showCreateKind ? "Kind anlegen ausblenden" : "+ Kind anlegen"}
                        </Button>

                        {showCreateKind && (
                            <div className="rounded-lg border p-4 space-y-5">
                                <p className="text-sm text-muted-foreground">
                                    Du kannst <b>eine oder mehrere</b> Bezugspersonen zuordnen. Mindestens <b>eine</b> ist Pflicht.
                                    Für jede Zuordnung wird eine <b>Rolle im Alltag</b> gespeichert (Relation Kind ↔ Bezugsperson).
                                </p>

                                <div className="space-y-2">
                                    <Label>Geburtsdatum</Label>
                                    <Input
                                        type="date"
                                        value={newKindGeburtsdatum}
                                        onChange={(e) => setNewKindGeburtsdatum(e.target.value)}
                                    />
                                </div>

                                <PersonFields value={newKind} onChange={setNewKind} prefix="Kind" idPrefix="kind" />

                                {/* Bezugspersonen auswählen */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold">Bezugsperson(en) auswählen</h4>

                                        <Button variant="link" className="px-0" onClick={() => setShowCreateBp(true)}>
                                            + Bezugsperson anlegen
                                        </Button>
                                    </div>

                                    {bezugspersonen.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2">
                                            {bezugspersonen.map((p) => {
                                                const checked = selectedBezugspersonIds.includes(p.id);
                                                const rolle = rolleByBezugspersonId[p.id] ?? "ELTERNTEIL";

                                                return (
                                                    <div key={`bp-${p.id}`} className="rounded-md border p-3">
                                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                            <label className="flex items-center gap-3">
                                                                <Checkbox checked={checked} onCheckedChange={() => toggleSelectedBp(p.id)} />
                                                                <span className="text-sm">{bpLabel(p)}</span>
                                                            </label>

                                                            <div className="w-full md:w-60">
                                                                <Label className="sr-only">Rolle im Alltag</Label>
                                                                <Select
                                                                    value={rolle}
                                                                    onValueChange={(v) =>
                                                                        setRolleByBezugspersonId((prev) => ({
                                                                            ...prev,
                                                                            [p.id]: v as RolleImAlltag,
                                                                        }))
                                                                    }
                                                                    disabled={!checked}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Rolle im Alltag" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {ROLLEN_IM_ALLTAG.map((r) => (
                                                                            <SelectItem key={r} value={r}>
                                                                                {r}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Keine Bezugspersonen vorhanden – bitte jetzt anlegen.</p>
                                    )}

                                    {/* Bezugsperson anlegen */}
                                    {(showCreateBp || bezugspersonen.length === 0) && (
                                        <div className="rounded-lg border p-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label>Standard-Rolle (für diese Zuordnung)</Label>
                                                <Select value={newRelationRole} onValueChange={(v) => setNewRelationRole(v as RolleImAlltag)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ROLLEN_IM_ALLTAG.map((r) => (
                                                            <SelectItem key={r} value={r}>
                                                                {r}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground">
                                                    Diese Rolle wird automatisch für die neu angelegte Bezugsperson gesetzt (Relation).
                                                </p>
                                            </div>

                                            <PersonFields value={newBp} onChange={setNewBp} prefix="Bezugsperson" idPrefix="bp" />

                                            <div className="flex flex-wrap gap-2">
                                                <Button type="button" onClick={() => createBezugsperson({ keepOpen: true })} disabled={creatingBp}>
                                                    {creatingBp ? "Speichern..." : "Speichern & weitere anlegen"}
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={() => createBezugsperson({ keepOpen: false })}
                                                    disabled={creatingBp}
                                                >
                                                    {creatingBp ? "Speichern..." : "Speichern & schließen"}
                                                </Button>

                                                {bezugspersonen.length > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => {
                                                            resetCreateBpForm();
                                                            setShowCreateBp(false);
                                                        }}
                                                        disabled={creatingBp}
                                                    >
                                                        Abbrechen
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Kind anlegen */}
                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={createKind} disabled={creatingKind}>
                                        {creatingKind ? "Anlegen..." : "Kind anlegen"}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            resetCreateKindForm();
                                            setShowCreateKind(false);
                                            setShowCreateBp(false);
                                        }}
                                        disabled={creatingKind}
                                    >
                                        Abbrechen
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div className="space-y-3">
                        <h3 className="text-base font-semibold">Beobachtung / Einschätzung</h3>
                        <Textarea
                            rows={6}
                            placeholder="Beschreibung der Beobachtung"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <div className="space-y-2">
                        <h3 className="text-base font-semibold">Überprüfung & Abschluss</h3>
                        <div className="text-sm text-muted-foreground">Bitte alle Angaben prüfen und den Draft-Fall erstellen.</div>

                        <div className="text-sm">
                            <span className="font-medium">Kind:</span> {selectedKindObj ? kindLabel(selectedKindObj) : "–"}
                        </div>

                        <div className="text-sm">
                            <span className="font-medium">Beschreibung:</span> {description || "–"}
                        </div>
                    </div>
                )}

                <Separator />

                {/* Footer */}
                <div className="flex items-center justify-between gap-3">
                    <Button variant="outline" onClick={prevStep} disabled={step === 1}>
                        Zurück
                    </Button>

                    <div className="flex gap-2">
                        <Button variant="destructive" onClick={onCancel}>
                            Abbrechen
                        </Button>

                        {step < 3 ? (
                            <Button onClick={onNext}>Weiter</Button>
                        ) : (
                            <Button onClick={createDraft} disabled={submittingDraft}>
                                {submittingDraft ? "Erstellen..." : "Erstellen"}
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}