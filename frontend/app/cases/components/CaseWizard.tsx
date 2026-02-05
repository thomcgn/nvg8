"use client";

import { useState } from "react";

interface CaseWizardProps {
    onCancel: () => void;
}

export default function CaseWizard({ onCancel }: CaseWizardProps) {
    const [step, setStep] = useState(1);

    const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    return (
        <div className="bg-white rounded-lg shadow p-8 max-w-3xl mx-auto">
            <div className="mb-6">
                <div className="h-2 bg-gray-200 rounded-full">
                    <div
                        className="h-2 bg-indigo-600 rounded-full"
                        style={{ width: `${(step / 4) * 100}%` }}
                    ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Schritt {step} von 4</p>
            </div>

            {step === 1 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Kinderdaten</h3>
                    <input className="w-full border p-2 rounded mb-2" placeholder="Name des Kindes" />
                    <input className="w-full border p-2 rounded mb-2" placeholder="Geburtsdatum" />
                    <input className="w-full border p-2 rounded mb-2" placeholder="Alter / Kita / Schule" />
                </div>
            )}

            {step === 2 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Erziehungsperson</h3>
                    <input className="w-full border p-2 rounded mb-2" placeholder="Name" />
                    <input className="w-full border p-2 rounded mb-2" placeholder="Telefon" />
                    <input className="w-full border p-2 rounded mb-2" placeholder="Adresse" />
                </div>
            )}

            {step === 3 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Fallbeschreibung</h3>
                    <textarea className="w-full border p-2 rounded mb-2" rows={5} placeholder="Beschreibung des Falls" />
                </div>
            )}

            {step === 4 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Überprüfung & Abschluss</h3>
                    <p>Bitte alle Angaben prüfen und den Fall erstellen.</p>
                </div>
            )}

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

                    {step < 4 ? (
                        <button
                            onClick={nextStep}
                            className="px-4 py-2 bg-indigo-600 text-white rounded"
                        >
                            Weiter
                        </button>
                    ) : (
                        <button
                            onClick={() => alert("Fall erstellt!")}
                            className="px-4 py-2 bg-green-600 text-white rounded"
                        >
                            Erstellen
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
