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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CaseWizardProps {
    onCancel: () => void;
}

type Kind = PersonBase & {
    id: number;
    geburtsdatum?: string; // ISO yyyy-mm-dd
};

type Erziehungsperson = PersonBase & {
    id: number;
    rolle?: string; // Enum string
};

export default function CaseWizard({ onCancel }: CaseWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [kinder, setKinder] = useState<Kind[]>([]);
    const [selectedKind, setSelectedKind] = useState<number | null>(null);

    const [erziehungspersonen, setErziehungspersonen] = useState<Erziehungsperson[]>([]);
    const [selectedErziehungspersonIds, setSelectedErziehungspersonIds] = useState<number[]>([]);

    // Create Kind UI
    const [showCreateKind, setShowCreateKind] = useState(false);
    const [creatingKind, setCreatingKind] = useState(false);
    const [newKind, setNewKind] = useState<PersonBase>(emptyPerson);
    const [newKindGeburtsdatum, setNewKindGeburtsdatum] = useState<string>("");

    // Create Erziehungsperson UI
    const [showCreateErz, setShowCreateErz] = useState(false);
    const [creatingErz, setCreatingErz] = useState(false);
    const [newErz, setNewErz] = useState<PersonBase>(emptyPerson);
    const [newErzRolle, setNewErzRolle] = useState<string>("ELTERN");

    const [description, setDescription] = useState("");
    const [submittingDraft, setSubmittingDraft] = useState(false);

    const progressValue = (step / 3) * 100;

    const kindLabel = (k: Kind) => `${k.vorname} ${k.nachname}`.trim() || `Kind #${k.id}`;
    const erzLabel = (p: Erziehungsperson) =>
        `${p.vorname} ${p.nachname}`.trim() || `Erziehungsperson #${p.id}`;

    const selectedKindObj = useMemo(
        () => kinder.find((k) => k.id === selectedKind) ?? null,
        [kinder, selectedKind]
    );

    const nextStep = () => setStep((prev) => (prev < 3 ? ((prev + 1) as any) : prev));
    const prevStep = () => setStep((prev) => (prev > 1 ? ((prev - 1) as any) : prev));

    useEffect(() => {
        const loadAll = async () => {
            try {
                const [kRes, eRes] = await Promise.all([
                    fetch("/api/cases/kinder", { credentials: "include", cache: "no-store" }),
                    fetch("/api/cases/erziehungspersonen", { credentials: "include", cache: "no-store" }),
                ]);

                if (kRes.ok) setKinder((await kRes.json()) as Kind[]);
                if (eRes.ok) setErziehungspersonen((await eRes.json()) as Erziehungsperson[]);
            } catch (e) {
                console.error(e);
                toast.error("Laden fehlgeschlagen", {
                    description: "Kinder oder Erziehungspersonen konnten nicht geladen werden.",
                });
            }
        };

        loadAll();
    }, []);

    const resetCreateKindForm = () => {
        setNewKind(emptyPerson);
        setNewKindGeburtsdatum("");
        setSelectedErziehungspersonIds([]);
    };

    const resetCreateErzForm = () => {
        setNewErz(emptyPerson);
        setNewErzRolle("ELTERN");
    };

    const toggleSelectedErz = (id: number) => {
        setSelectedErziehungspersonIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const createErziehungsperson = async ({ keepOpen }: { keepOpen: boolean }) => {
        if (!newErz.vorname.trim() || !newErz.nachname.trim()) {
            toast.error("Pflichtfelder fehlen", {
                description: "Bitte Vorname und Nachname der Erziehungsperson ausfüllen.",
            });
            return;
        }

        if (!newErzRolle.trim()) {
            toast.error("Rolle fehlt", {
                description: "Bitte eine Rolle auswählen.",
            });
            return;
        }

        setCreatingErz(true);
        try {
            const res = await fetch("/api/cases/erziehungspersonen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ ...newErz, rolle: newErzRolle }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`Fehler beim Anlegen (${res.status}) ${text}`);
            }

            const created = (await res.json()) as Erziehungsperson;

            setErziehungspersonen((prev) => [created, ...prev]);
            setSelectedErziehungspersonIds((prev) =>
                prev.includes(created.id) ? prev : [...prev, created.id]
            );

            resetCreateErzForm();
            setShowCreateErz(keepOpen);

            toast.success("Erziehungsperson angelegt", {
                description: `${erzLabel(created)} wurde hinzugefügt und ausgewählt.`,
            });
        } catch (err: any) {
            console.error(err);
            toast.error("Anlegen fehlgeschlagen", {
                description: err?.message || "Unbekannter Fehler beim Anlegen der Erziehungsperson.",
            });
        } finally {
            setCreatingErz(false);
        }
    };

    const createKind = async () => {
        if (!newKind.vorname.trim() || !newKind.nachname.trim()) {
            toast.error("Pflichtfelder fehlen", {
                description: "Bitte Vorname und Nachname des Kindes ausfüllen.",
            });
            return;
        }

        if (!newKindGeburtsdatum) {
            toast.error("Geburtsdatum fehlt", {
                description: "Bitte Geburtsdatum angeben.",
            });
            return;
        }

        if (selectedErziehungspersonIds.length === 0) {
            toast.error("Zuordnung fehlt", {
                description: "Ein Kind benötigt mindestens eine Erziehungsperson.",
            });
            return;
        }

        setCreatingKind(true);
        try {
            const res = await fetch("/api/cases/kinder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...newKind,
                    geburtsdatum: newKindGeburtsdatum,
                    erziehungspersonIds: selectedErziehungspersonIds,
                }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`Fehler beim Anlegen (${res.status}) ${text}`);
            }

            const created = (await res.json()) as Kind;

            setKinder((prev) => [created, ...prev]);
            setSelectedKind(created.id);

            resetCreateKindForm();
            setShowCreateKind(false);
            setShowCreateErz(false);

            toast.success("Kind angelegt", {
                description: `${kindLabel(created)} wurde erstellt und ausgewählt.`,
            });
        } catch (err: any) {
            console.error(err);
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
                toast.error("Kind fehlt", {
                    description: "Bitte ein Kind auswählen (oder anlegen).",
                });
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

        setSubmittingDraft(true);
        try {
            const res = await fetch("/api/cases/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ kindId: selectedKind, description }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`Fehler beim Erstellen (${res.status}) ${text}`);
            }

            const draft = await res.json();

            toast.success("Draft-Fall erstellt", {
                description: `ID: ${draft?.id ?? "–"}`,
            });

            onCancel();
        } catch (err: any) {
            console.error(err);
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
                <div className="space-y-2">
                    <Progress value={progressValue} />
                    <div className="text-sm text-muted-foreground">
                        Schritt <span className="font-medium text-foreground">{step}</span> von 3
                    </div>
                </div>

                <Separator />

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-semibold">Kind auswählen</h3>
                            <Badge variant="outline">Stammdaten</Badge>
                        </div>

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
                                        <SelectItem key={k.id} value={String(k.id)}>
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
                                    Du kannst <b>eine oder mehrere</b> Erziehungspersonen zuordnen. Mindestens <b>eine</b> ist Pflicht.
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

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold">Erziehungsperson(en) auswählen</h4>
                                        <Button variant="link" className="px-0" onClick={() => setShowCreateErz(true)}>
                                            + Erziehungsperson anlegen
                                        </Button>
                                    </div>

                                    {erziehungspersonen.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {erziehungspersonen.map((p) => {
                                                const checked = selectedErziehungspersonIds.includes(p.id);
                                                return (
                                                    <label key={p.id} className="flex items-center gap-3 rounded-md border p-3">
                                                        <Checkbox checked={checked} onCheckedChange={() => toggleSelectedErz(p.id)} />
                                                        <span className="text-sm">{erzLabel(p)}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Keine Erziehungspersonen vorhanden – bitte jetzt anlegen.
                                        </p>
                                    )}

                                    {(showCreateErz || erziehungspersonen.length === 0) && (
                                        <div className="rounded-lg border p-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label>Rolle</Label>
                                                <Select value={newErzRolle} onValueChange={setNewErzRolle}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ELTERN">ELTERN</SelectItem>
                                                        <SelectItem value="BETREUER">BETREUER</SelectItem>
                                                        <SelectItem value="VORMUND">VORMUND</SelectItem>
                                                        <SelectItem value="PFLEGESCHWESTER">PFLEGESCHWESTER</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <PersonFields value={newErz} onChange={setNewErz} prefix="Erziehungsperson" idPrefix="erz" />

                                            <div className="flex flex-wrap gap-2">
                                                <Button type="button" onClick={() => createErziehungsperson({ keepOpen: true })} disabled={creatingErz}>
                                                    {creatingErz ? "Speichern..." : "Speichern & weitere anlegen"}
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={() => createErziehungsperson({ keepOpen: false })}
                                                    disabled={creatingErz}
                                                >
                                                    {creatingErz ? "Speichern..." : "Speichern & schließen"}
                                                </Button>

                                                {erziehungspersonen.length > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => {
                                                            resetCreateErzForm();
                                                            setShowCreateErz(false);
                                                        }}
                                                        disabled={creatingErz}
                                                    >
                                                        Abbrechen
                                                    </Button>
                                                )}
                                            </div>

                                            <p className="text-xs text-muted-foreground">
                                                Jede neu angelegte Erziehungsperson wird automatisch ausgewählt.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={createKind} disabled={creatingKind}>
                                        {creatingKind ? "Anlegen..." : "Kind anlegen"}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            resetCreateKindForm();
                                            setShowCreateKind(false);
                                            setShowCreateErz(false);
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