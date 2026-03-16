"use client";

import React, { useState } from "react";
import type { ChangeReason } from "@/lib/meldungen/api";

type Props = {
    open: boolean;
    title?: string;
    onCloseAction: () => void;
    onConfirmAction: (v: { changeReason: ChangeReason; infoEffectiveAt?: string; reasonText?: string }) => void;
};

function requiresInfoEffectiveAt(reason: ChangeReason) {
    return reason === "NACHTRAG" || reason === "UPDATE" || reason === "REASSESSMENT";
}

type ModalForm = { changeReason: ChangeReason; infoEffectiveAt: string; reasonText: string; error: string | null };
const INIT_FORM: ModalForm = { changeReason: "FIX", infoEffectiveAt: "", reasonText: "", error: null };

/** Outer gate – when closed the inner component unmounts, resetting state naturally. */
export default function ChangeReasonModal({ open, title, onCloseAction, onConfirmAction }: Props) {
    if (!open) return null;
    return (
        <ChangeReasonModalInner
            title={title}
            onCloseAction={onCloseAction}
            onConfirmAction={onConfirmAction}
        />
    );
}

function ChangeReasonModalInner({ title, onCloseAction, onConfirmAction }: Omit<Props, "open">) {
    const [form, setForm] = useState<ModalForm>(INIT_FORM);
    const { changeReason, infoEffectiveAt, reasonText, error } = form;

    const needsInfo = requiresInfoEffectiveAt(changeReason);

    function submit() {
        setForm((f) => ({ ...f, error: null }));

        if (!changeReason) {
            setForm((f) => ({ ...f, error: "Änderungsgrund ist erforderlich." }));
            return;
        }
        if (needsInfo && !infoEffectiveAt) {
            setForm((f) => ({ ...f, error: "Bitte Zeitpunkt der Kenntniserlangung angeben." }));
            return;
        }

        onConfirmAction({
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
                <button className="mBtn" onClick={onCloseAction} aria-label="Schließen">✕</button>
            </div>

            {error && <div className="mError">{error}</div>}

            <div className="mFormRow">
                <label>Änderungsgrund (Pflicht)</label>
                <select value={changeReason} onChange={(e) => setForm((f) => ({ ...f, changeReason: e.target.value as ChangeReason }))}>
                    <option value="FIX">Korrektur (Fehlerberichtigung)</option>
                    <option value="NACHTRAG">Nachtrag (neue Information)</option>
                    <option value="UPDATE">Sachlage geändert (Update)</option>
                    <option value="REASSESSMENT">Fachliche Neubewertung</option>
                </select>
            </div>

            {needsInfo && (
                <div className="mFormRow">
                    <label>Zeitpunkt Kenntniserlangung (Pflicht)</label>
                    <input type="datetime-local" value={infoEffectiveAt} onChange={(e) => setForm((f) => ({ ...f, infoEffectiveAt: e.target.value }))} />
                    <div className="mHint">Wann wurde die neue Information bekannt (z. B. Mutter/Arzt später erreicht)?</div>
                </div>
            )}

            <div className="mFormRow">
                <label>Kurzbegründung (empfohlen)</label>
                <textarea rows={3} value={reasonText} onChange={(e) => setForm((f) => ({ ...f, reasonText: e.target.value }))} />
            </div>

            <div className="mModalActions">
                <button className="mBtn" onClick={onCloseAction}>Abbrechen</button>
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