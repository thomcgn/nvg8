"use client";

import { useState, useEffect } from "react";

interface CaseWizardProps {
    onCancel: () => void;
}

type Kind = { id: number; name: string };

export default function CaseWizard({ onCancel }: CaseWizardProps) {
    const [step, setStep] = useState(1);

    const [kinder, setKinder] = useState<Kind[]>([]);
    const [selectedKind, setSelectedKind] = useState<number | null>(null);

    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadKinder = async () => {
            try {
                const res = await fetch("/api/cases/kinder", {
                    credentials: "include",
                    cache: "no-store",
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(`Fehler beim Laden der Kinder (${res.status}) ${text}`);
                }

                const data = (await res.json()) as Kind[];
                setKinder(data);
            } catch (e) {
                console.error(e);
            }
        };

        loadKinder();
    }, []);

    const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    // ✅ Cookie Auth (HttpOnly) -> credentials include
    // ✅ Kein localStorage jwt, kein Authorization Header
    const createDraft = async () => {
        if (!selectedKind) return alert("Bitte ein Kind auswählen");

        setLoading(true);
        try {
            const res = await fetch("/api/cases/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    kindId: selectedKind,
                    description, // ✅ Beschreibung gleich mitsenden
                }),
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
        <div className="bg-white rounded-lg shadow p-8 max-w-3xl mx-auto">
            {/* Fortschrittsanzeige */}
            <div className="mb-6">
                <div className="h-2 bg-gray-200 rounded-full">
                    <div
                        className="h-2 bg-indigo-600 rounded-full"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
                <p className="text-sm text-gray-500 mt-1">Schritt {step} von 3</p>
            </div>

            {/* Schritt-Inhalte */}
            {step === 1 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Kind auswählen</h3>
                    <select
                        className="w-full border p-2 rounded"
                        value={selectedKind ?? ""}
                        onChange={(e) => setSelectedKind(e.target.value ? Number(e.target.value) : null)}
                    >
                        <option value="">-- Bitte auswählen --</option>
                        {kinder.map((k) => (
                            <option key={k.id} value={k.id}>
                                {k.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {step === 2 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Beobachtung / Einschätzung</h3>
                    <textarea
                        rows={5}
                        className="w-full border p-2 rounded"
                        placeholder="Beschreibung der Beobachtung"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            )}

            {step === 3 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Überprüfung & Abschluss</h3>
                    <p>Bitte alle Angaben prüfen und den Draft-Fall erstellen.</p>
                    <p>Kind: {kinder.find((k) => k.id === selectedKind)?.name ?? "–"}</p>
                    <p>Beschreibung: {description || "–"}</p>
                </div>
            )}

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
                <button
                    onClick={prevStep}
                    disabled={step === 1}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                    Zurück
                </button>

                <div className="flex gap-2">
                    <button onClick={onCancel} className="px-4 py-2 bg-red-500 text-white rounded">
                        Abbrechen
                    </button>

                    {step < 3 ? (
                        <button onClick={nextStep} className="px-4 py-2 bg-indigo-600 text-white rounded">
                            Weiter
                        </button>
                    ) : (
                        <button
                            onClick={createDraft}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                        >
                            {loading ? "Erstellen..." : "Erstellen"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
