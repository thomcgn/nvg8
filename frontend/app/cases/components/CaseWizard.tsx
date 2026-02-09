"use client";

import { useState, useEffect } from "react";
import { Case } from "@/app/dashboard/components/types";

interface CaseWizardProps {
    onCancel: () => void;
}

export default function CaseWizard({ onCancel }: CaseWizardProps) {
    const [step, setStep] = useState(1);
    const [kinder, setKinder] = useState<{ id: number; name: string }[]>([]);
    const [selectedKind, setSelectedKind] = useState<number | null>(null);
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    useEffect(() => {
        // Kinder aus API laden
        fetch(`${API_URL}/kinder`)
            .then((res) => res.json())
            .then((data) => setKinder(data))
            .catch(console.error);
    }, []);

    const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    const createDraft = async () => {
        if (!selectedKind) return alert("Bitte ein Kind auswählen");

        setLoading(true);
        try {
            const token = localStorage.getItem("jwt");
            const res = await fetch(`${API_URL}/cases/draft`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ kindId: selectedKind }),
            });

            if (!res.ok) throw new Error("Fehler beim Erstellen des Draft-Falls");

            const draft = await res.json();
            alert("Draft-Fall erstellt! ID: " + draft.id);
            onCancel(); // Wizard schließen
        } catch (err: any) {
            console.error(err);
            alert(err.message);
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
                        onChange={(e) => setSelectedKind(Number(e.target.value))}
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
                    <p>Kind: {kinder.find((k) => k.id === selectedKind)?.name}</p>
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
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-red-500 text-white rounded"
                    >
                        Abbrechen
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            className="px-4 py-2 bg-indigo-600 text-white rounded"
                        >
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
