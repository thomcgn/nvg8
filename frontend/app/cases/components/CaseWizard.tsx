"use client";

import { useEffect, useMemo, useState } from "react";

interface CaseWizardProps {
    onCancel: () => void;
}

type PersonBase = {
    vorname: string;
    nachname: string;
    strasse: string;
    hausnummer: string;
    plz: string;
    ort: string;
    telefon: string;
    email: string;
};

type Kind = PersonBase & {
    id: number;
    geburtsdatum?: string; // ISO yyyy-mm-dd
};

type Erziehungsperson = PersonBase & {
    id: number;
    rolle?: string; // Enum string
};

const emptyPerson: PersonBase = {
    vorname: "",
    nachname: "",
    strasse: "",
    hausnummer: "",
    plz: "",
    ort: "",
    telefon: "",
    email: "",
};

/**
 * ✅ WICHTIG:
 * Diese Komponente MUSS außerhalb von CaseWizard definiert sein,
 * sonst verliert der Input bei jedem Re-Render den Fokus.
 */
function PersonFields({
                          value,
                          onChange,
                          prefix,
                      }: {
    value: PersonBase;
    onChange: (v: PersonBase) => void;
    prefix: string;
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label className="block text-sm font-semibold text-black mb-1">{prefix} Vorname</label>
                <input
                    className="w-full border p-2 rounded text-black placeholder:text-black/50"
                    value={value.vorname}
                    onChange={(e) => onChange({ ...value, vorname: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-black mb-1">{prefix} Nachname</label>
                <input
                    className="w-full border p-2 rounded text-black placeholder:text-black/50"
                    value={value.nachname}
                    onChange={(e) => onChange({ ...value, nachname: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-black mb-1">Straße</label>
                <input
                    className="w-full border p-2 rounded text-black placeholder:text-black/50"
                    value={value.strasse}
                    onChange={(e) => onChange({ ...value, strasse: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-black mb-1">Hausnummer</label>
                <input
                    className="w-full border p-2 rounded text-black placeholder:text-black/50"
                    value={value.hausnummer}
                    onChange={(e) => onChange({ ...value, hausnummer: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-black mb-1">PLZ</label>
                <input
                    className="w-full border p-2 rounded text-black placeholder:text-black/50"
                    value={value.plz}
                    onChange={(e) => onChange({ ...value, plz: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-black mb-1">Ort</label>
                <input
                    className="w-full border p-2 rounded text-black placeholder:text-black/50"
                    value={value.ort}
                    onChange={(e) => onChange({ ...value, ort: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-black mb-1">Telefon</label>
                <input
                    className="w-full border p-2 rounded text-black placeholder:text-black/50"
                    value={value.telefon}
                    onChange={(e) => onChange({ ...value, telefon: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-black mb-1">E-Mail</label>
                <input
                    type="email"
                    className="w-full border p-2 rounded text-black placeholder:text-black/50"
                    value={value.email}
                    onChange={(e) => onChange({ ...value, email: e.target.value })}
                />
            </div>
        </div>
    );
}

export default function CaseWizard({ onCancel }: CaseWizardProps) {
    const [step, setStep] = useState(1);

    const [kinder, setKinder] = useState<Kind[]>([]);
    const [selectedKind, setSelectedKind] = useState<number | null>(null);

    const [erziehungspersonen, setErziehungspersonen] = useState<Erziehungsperson[]>([]);
    const [selectedErziehungspersonIds, setSelectedErziehungspersonIds] = useState<number[]>([]);

    // ✅ Create Kind UI
    const [showCreateKind, setShowCreateKind] = useState(false);
    const [creatingKind, setCreatingKind] = useState(false);
    const [newKind, setNewKind] = useState<PersonBase>(emptyPerson);
    const [newKindGeburtsdatum, setNewKindGeburtsdatum] = useState<string>("");

    // ✅ Create Erziehungsperson UI
    const [showCreateErz, setShowCreateErz] = useState(false);
    const [creatingErz, setCreatingErz] = useState(false);
    const [newErz, setNewErz] = useState<PersonBase>(emptyPerson);
    const [newErzRolle, setNewErzRolle] = useState<string>("ELTERN");

    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    const kindLabel = (k: Kind) => `${k.vorname} ${k.nachname}`.trim() || `Kind #${k.id}`;
    const erzLabel = (p: Erziehungsperson) =>
        `${p.vorname} ${p.nachname}`.trim() || `Erziehungsperson #${p.id}`;

    const selectedKindObj = useMemo(
        () => kinder.find((k) => k.id === selectedKind) ?? null,
        [kinder, selectedKind]
    );

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

    // ✅ Kann beliebig oft hintereinander genutzt werden.
    // keepOpen=true => Formular bleibt offen, Felder werden geleert, neu angelegte Person bleibt ausgewählt.
    const createErziehungsperson = async ({ keepOpen }: { keepOpen: boolean }) => {
        if (!newErz.vorname.trim() || !newErz.nachname.trim()) {
            return alert("Bitte Vorname und Nachname der Erziehungsperson ausfüllen.");
        }
        if (!newErzRolle.trim()) return alert("Bitte eine Rolle auswählen.");

        setCreatingErz(true);
        try {
            const res = await fetch("/api/cases/erziehungspersonen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...newErz,
                    rolle: newErzRolle,
                }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`Fehler beim Anlegen der Erziehungsperson (${res.status}) ${text}`);
            }

            const created = (await res.json()) as Erziehungsperson;

            // ✅ Liste ergänzen + automatisch auswählen (und damit später mit Kind verknüpfen)
            setErziehungspersonen((prev) => [created, ...prev]);
            setSelectedErziehungspersonIds((prev) =>
                prev.includes(created.id) ? prev : [...prev, created.id]
            );

            // ✅ für "weitere anlegen": Felder leeren, Formular offen lassen
            resetCreateErzForm();
            setShowCreateErz(keepOpen);
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Unbekannter Fehler beim Anlegen der Erziehungsperson");
        } finally {
            setCreatingErz(false);
        }
    };

    const createKind = async () => {
        if (!newKind.vorname.trim() || !newKind.nachname.trim()) {
            return alert("Bitte Vorname und Nachname des Kindes ausfüllen.");
        }
        if (!newKindGeburtsdatum) return alert("Bitte Geburtsdatum angeben.");
        if (selectedErziehungspersonIds.length === 0) {
            return alert("Ein Kind benötigt mindestens eine Erziehungsperson.");
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
                    erziehungspersonIds: selectedErziehungspersonIds, // ✅ mehrere möglich
                }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`Fehler beim Anlegen des Kindes (${res.status}) ${text}`);
            }

            const created = (await res.json()) as Kind;
            setKinder((prev) => [created, ...prev]);
            setSelectedKind(created.id);

            resetCreateKindForm();
            setShowCreateKind(false);
            setShowCreateErz(false);
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Unbekannter Fehler beim Anlegen des Kindes");
        } finally {
            setCreatingKind(false);
        }
    };

    const createDraft = async () => {
        if (!selectedKind) return alert("Bitte ein Kind auswählen");

        setLoading(true);
        try {
            const res = await fetch("/api/cases/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ kindId: selectedKind, description }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`Fehler beim Erstellen des Draft-Falls (${res.status}) ${text}`);
            }

            const draft = await res.json();
            alert("Draft-Fall erstellt! ID: " + draft.id);
            onCancel();
        } catch (err: any) {
            console.error(err);
            alert(err?.message || "Unbekannter Fehler");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white text-black rounded-lg shadow p-8 max-w-3xl mx-auto">
            {/* Fortschrittsanzeige */}
            <div className="mb-6">
                <div className="h-2 bg-gray-200 rounded-full">
                    <div
                        className="h-2 bg-indigo-600 rounded-full"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
                <p className="text-sm text-black mt-1">Schritt {step} von 3</p>
            </div>

            {step === 1 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-black">Kind auswählen</h3>

                    <select
                        className="w-full border p-2 rounded text-black"
                        value={selectedKind ?? ""}
                        onChange={(e) => setSelectedKind(e.target.value ? Number(e.target.value) : null)}
                    >
                        <option value="">-- Bitte auswählen --</option>
                        {kinder.map((k) => (
                            <option key={k.id} value={k.id}>
                                {kindLabel(k)}
                            </option>
                        ))}
                    </select>

                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={() => setShowCreateKind((v) => !v)}
                            className="text-indigo-700 hover:underline text-sm font-semibold"
                        >
                            {showCreateKind ? "Kind anlegen ausblenden" : "+ Kind anlegen"}
                        </button>

                        {showCreateKind && (
                            <div className="mt-3 border rounded p-4 bg-white">
                                <p className="text-sm text-black mb-3">
                                    Du kannst <b>eine oder mehrere</b> Erziehungspersonen zuordnen (z.B. beide Elternteile).
                                    Mindestens <b>eine</b> ist Pflicht.
                                </p>

                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-black mb-1">Geburtsdatum</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded text-black"
                                        value={newKindGeburtsdatum}
                                        onChange={(e) => setNewKindGeburtsdatum(e.target.value)}
                                    />
                                </div>

                                <PersonFields value={newKind} onChange={setNewKind} prefix="Kind" />

                                <div className="mt-5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-black">Erziehungsperson(en) auswählen</h4>
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateErz(true)}
                                            className="text-indigo-700 hover:underline text-sm font-semibold"
                                        >
                                            + Erziehungsperson anlegen
                                        </button>
                                    </div>

                                    {erziehungspersonen.length > 0 ? (
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {erziehungspersonen.map((p) => {
                                                const checked = selectedErziehungspersonIds.includes(p.id);
                                                return (
                                                    <label
                                                        key={p.id}
                                                        className="flex items-center gap-2 border rounded p-2 bg-white text-black"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleSelectedErz(p.id)}
                                                        />
                                                        <span className="text-sm text-black">{erzLabel(p)}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-sm text-black">
                                            Keine Erziehungspersonen vorhanden – bitte jetzt anlegen (auch mehrere nacheinander).
                                        </p>
                                    )}

                                    {(showCreateErz || erziehungspersonen.length === 0) && (
                                        <div className="mt-3 border rounded p-4 bg-white">
                                            <div className="mb-3">
                                                <label className="block text-sm font-semibold text-black mb-1">Rolle</label>
                                                <select
                                                    className="w-full border p-2 rounded text-black"
                                                    value={newErzRolle}
                                                    onChange={(e) => setNewErzRolle(e.target.value)}
                                                >
                                                    <option value="ELTERN">ELTERN</option>
                                                    <option value="BETREUER">BETREUER</option>
                                                    <option value="VORMUND">VORMUND</option>
                                                    <option value="PFLEGESCHWESTER">PFLEGESCHWESTER</option>
                                                </select>
                                            </div>

                                            <PersonFields value={newErz} onChange={setNewErz} prefix="Erziehungsperson" />

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => createErziehungsperson({ keepOpen: true })}
                                                    disabled={creatingErz}
                                                    className="px-4 py-2 bg-indigo-700 text-white rounded disabled:opacity-50"
                                                >
                                                    {creatingErz ? "Speichern..." : "Speichern & weitere anlegen"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => createErziehungsperson({ keepOpen: false })}
                                                    disabled={creatingErz}
                                                    className="px-4 py-2 bg-indigo-100 text-indigo-900 rounded disabled:opacity-50"
                                                >
                                                    {creatingErz ? "Speichern..." : "Speichern & schließen"}
                                                </button>

                                                {erziehungspersonen.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            resetCreateErzForm();
                                                            setShowCreateErz(false);
                                                        }}
                                                        disabled={creatingErz}
                                                        className="px-4 py-2 bg-gray-200 text-black rounded disabled:opacity-50"
                                                    >
                                                        Abbrechen
                                                    </button>
                                                )}
                                            </div>

                                            <p className="text-xs text-black mt-2">
                                                Jede neu angelegte Erziehungsperson wird automatisch ausgewählt und beim Kind verknüpft.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={createKind}
                                        disabled={creatingKind}
                                        className="px-4 py-2 bg-green-700 text-white rounded disabled:opacity-50"
                                    >
                                        {creatingKind ? "Anlegen..." : "Kind anlegen"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            resetCreateKindForm();
                                            setShowCreateKind(false);
                                            setShowCreateErz(false);
                                        }}
                                        disabled={creatingKind}
                                        className="px-4 py-2 bg-gray-200 text-black rounded disabled:opacity-50"
                                    >
                                        Abbrechen
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-black">Beobachtung / Einschätzung</h3>
                    <textarea
                        rows={5}
                        className="w-full border p-2 rounded text-black placeholder:text-black/50"
                        placeholder="Beschreibung der Beobachtung"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            )}

            {step === 3 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-black">Überprüfung & Abschluss</h3>
                    <p className="text-black">Bitte alle Angaben prüfen und den Draft-Fall erstellen.</p>
                    <p className="text-black">Kind: {selectedKindObj ? kindLabel(selectedKindObj) : "–"}</p>
                    <p className="text-black">Beschreibung: {description || "–"}</p>
                </div>
            )}

            <div className="mt-6 flex justify-between">
                <button
                    onClick={prevStep}
                    disabled={step === 1}
                    className="px-4 py-2 bg-gray-200 text-black rounded disabled:opacity-50"
                >
                    Zurück
                </button>

                <div className="flex gap-2">
                    <button onClick={onCancel} className="px-4 py-2 bg-red-600 text-white rounded">
                        Abbrechen
                    </button>

                    {step < 3 ? (
                        <button onClick={nextStep} className="px-4 py-2 bg-indigo-700 text-white rounded">
                            Weiter
                        </button>
                    ) : (
                        <button
                            onClick={createDraft}
                            disabled={loading}
                            className="px-4 py-2 bg-green-700 text-white rounded disabled:opacity-50"
                        >
                            {loading ? "Erstellen..." : "Erstellen"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
