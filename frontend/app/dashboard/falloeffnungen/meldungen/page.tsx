"use client";

import "@/components/meldungen/meldungen.css";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function MeldungenPickerPage() {
    const [meldungId, setMeldungId] = useState("");
    const [fallId, setFallId] = useState("");

    const canOpen = useMemo(() => meldungId.trim().length > 0, [meldungId]);

    function open() {
        const id = meldungId.trim();
        if (!id) return;
        window.location.href = `/dashboard/falloeffnungen/meldungen/${id}`;
    }

    return (
        <div className="mPage">
            <header className="mHeader">
                <div>
                    <div className="mSub">
                        <Link href="/dashboard/falloeffnungen">← zurück</Link>
                    </div>
                    <h1>Meldungen</h1>
                    <div className="mSub">Schnellzugriff (ID eingeben)</div>
                </div>
            </header>

            <section className="mCard">
                <h2>Meldung öffnen</h2>

                <div className="mFormRow">
                    <label>Meldung-ID</label>
                    <input
                        placeholder="z. B. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                        value={meldungId}
                        onChange={(e) => setMeldungId(e.target.value)}
                    />
                </div>

                <div className="mFormRow">
                    <label>Fall-ID (optional, fürs spätere Listing)</label>
                    <input
                        placeholder="optional"
                        value={fallId}
                        onChange={(e) => setFallId(e.target.value)}
                    />
                    <div className="mHint">
                        Wenn du später einen Endpoint “Meldungen nach Fall” hast, kann diese Seite hier automatisch listen.
                    </div>
                </div>

                <div className="mModalActions" style={{ justifyContent: "flex-start" }}>
                    <button className="mBtn mBtnPrimary" disabled={!canOpen} onClick={open}>
                        Öffnen
                    </button>
                    <button className="mBtn" onClick={() => { setMeldungId(""); setFallId(""); }}>
                        Zurücksetzen
                    </button>
                </div>
            </section>
        </div>
    );
}