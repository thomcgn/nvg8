"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ChangeReason } from "@/lib/meldungen/api";

type Props = {
    open: boolean;
    title?: string;
    onClose: () => void;
    onConfirm: (v: { changeReason: ChangeReason; infoEffectiveAt?: string; reasonText?: string }) => void;
};

function requiresInfoEffectiveAt(reason: ChangeReason) {
    return reason === "nachtrag" || reason === "update" || reason === "reassessment";
}

export default function ChangeReasonModal({ open, title, onClose, onConfirm }: Props) {
    const [changeReason, setChangeReason] = useState<ChangeReason>("fix");
    const [infoEffectiveAt, setInfoEffectiveAt] = useState<string>("");
    const [reasonText, setReasonText] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setChangeReason("fix");
            setInfoEffectiveAt("");
            setReasonText("");
            setError(null);
        }
    }, [open]);

    if (!open) return null;

    const needsInfo = requiresInfoEffectiveAt(changeReason);

    function submit() {
        setError(null);

        if (!changeReason) {
            setError("Änderungsgrund ist erforderlich.");
            return;
        }
        if (needsInfo && !infoEffectiveAt) {
            setError("Bitte Zeitpunkt der Kenntniserlangung angeben.");
            return;
        }

        onConfirm({
            changeReason,
            infoEffectiveAt: infoEffectiveAt ? fromLocalDatetimeInput(infoEffectiveAt) : undefined,
            reasonText: reasonText?.trim() ? reasonText.trim() : undefined,
        });
    }

    return (
        <div className="mModalBackdrop" role="dialog" aria-modal="true">
            <div className="mModal">
                <div className="mModalHeader">
                    <div>
                        <div className="mBadge mBadgeSoft">Pflichtangaben</div>
                        <h3 style={{ margin: "8px 0 0 0" }}>{title ?? "Neue Version erstellen"}</h3>
                    </div>
                    <button className="mBtn" onClick={onClose} aria-label="Schließen">✕</button>
                </div>

                {error && <div className="mError">{error}</div>}

                <div className="mFormRow">
                    <label>Änderungsgrund (Pflicht)</label>
                    <select value={changeReason} onChange={(e) => setChangeReason(e.target.value as ChangeReason)}>
                        <option value="fix">Korrektur (Fehlerberichtigung)</option>
                        <option value="nachtrag">Nachtrag (neue Information)</option>
                        <option value="update">Sachlage geändert (Update)</option>
                        <option value="reassessment">Fachliche Neubewertung</option>
                    </select>
                </div>

                {needsInfo && (
                    <div className="mFormRow">
                        <label>Zeitpunkt Kenntniserlangung (Pflicht)</label>
                        <input type="datetime-local" value={infoEffectiveAt} onChange={(e) => setInfoEffectiveAt(e.target.value)} />
                        <div className="mHint">Wann wurde die neue Information bekannt (z. B. Mutter/Arzt später erreicht)?</div>
                    </div>
                )}

                <div className="mFormRow">
                    <label>Kurzbegründung (empfohlen)</label>
                    <textarea rows={3} value={reasonText} onChange={(e) => setReasonText(e.target.value)} />
                </div>

                <div className="mModalActions">
                    <button className="mBtn" onClick={onClose}>Abbrechen</button>
                    <button className="mBtn mBtnPrimary" onClick={submit}>Weiter</button>
                </div>
            </div>
        </div>
    );
}

// datetime-local => ISO (local interpreted)
function fromLocalDatetimeInput(v: string) {
    const d = new Date(v);
    return d.toISOString();
}