import type { FalleroeffnungResponse } from "@/lib/types";
import type { MeldungResponse } from "@/lib/meldungApi";

type MeldungPrintDocumentProps = {
    fall: FalleroeffnungResponse | null;
    d: MeldungResponse;
};

function formatDateTimeDE(value: string | null | undefined) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatDateDE(value: string | null | undefined) {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
    }).format(date);
}

function normalize(v: unknown) {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? "Ja" : "Nein";
    return String(v);
}

function PrintField({
                        label,
                        value,
                        className = "",
                    }: {
    label: string;
    value: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`print-card rounded-md border border-slate-300 p-3 ${className}`}>
            <div className="text-[9pt] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {label}
            </div>
            <div className="mt-1 whitespace-pre-wrap break-words text-[10.5pt] text-slate-900">
                {value ?? "—"}
            </div>
        </div>
    );
}

function PrintSection({
                          title,
                          children,
                          pageBreak = false,
                      }: {
    title: string;
    children: React.ReactNode;
    pageBreak?: boolean;
}) {
    return (
        <section className={`print-section ${pageBreak ? "print-page-break" : ""}`}>
            <h2 className="print-section-title">{title}</h2>
            {children}
        </section>
    );
}

function PrintTable({
                        columns,
                        rows,
                    }: {
    columns: { key: string; label: string }[];
    rows: Record<string, React.ReactNode>[];
}) {
    return (
        <div className="print-table-wrap">
            <table className="print-table">
                <thead>
                <tr>
                    {columns.map((c) => (
                        <th key={c.key}>{c.label}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {rows.length > 0 ? (
                    rows.map((row, idx) => (
                        <tr key={idx} className="print-row">
                            {columns.map((c) => (
                                <td key={c.key}>{row[c.key] ?? "—"}</td>
                            ))}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={columns.length}>—</td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}

export default function MeldungPrintDocument({
                                                 fall,
                                                 d,
                                             }: MeldungPrintDocumentProps) {
    const isCorrection =
        String(d.type ?? "").toUpperCase() === "KORREKTUR" || !!d.correctsId;

    return (
        <article className="print-doc bg-white text-slate-900">
            <header className="mb-8 border-b border-slate-300 pb-5">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <h1 className="text-[22pt] font-bold tracking-tight">
                            Meldungsdokumentation
                        </h1>
                        <div className="mt-1 text-[10pt] text-slate-600">
                            Druckansicht / PDF
                        </div>
                    </div>

                    <div className="text-right text-[10pt] leading-6 text-slate-700">
                        <div>
                            <span className="font-semibold">Typ:</span> {normalize(d.type)}
                        </div>
                        <div>
                            <span className="font-semibold">Version:</span> v{normalize(d.versionNo)}
                        </div>
                        <div>
                            <span className="font-semibold">Erstellt:</span> {formatDateTimeDE(d.createdAt)}
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                    <PrintField label="Aktenzeichen" value={fall?.aktenzeichen ?? "—"} />
                    <PrintField label="Kind" value={fall?.kindName ?? "—"} />
                </div>

                {isCorrection ? (
                    <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-[10pt] text-slate-900">
                        <span className="font-semibold">Korrekturvermerk:</span>{" "}
                        Diese Meldung ist eine Korrektur
                        {d.correctsId ? ` zur Meldung #${d.correctsId}` : ""}.
                    </div>
                ) : null}
            </header>

            <PrintSection title="Kernangaben">
                <div className="grid grid-cols-2 gap-4">
                    <PrintField label="Kurzbeschreibung" value={d.kurzbeschreibung ?? "—"} />
                    <PrintField label="Zusammenfassung" value={d.zusammenfassung ?? "—"} />
                    <PrintField label="Dringlichkeit" value={d.dringlichkeit ?? "—"} />
                    <PrintField label="Fach-Ampel" value={d.fachAmpel ?? "—"} />
                    <PrintField
                        label="Gefahr im Verzug"
                        value={d.akutGefahrImVerzug ? "Ja" : "Nein"}
                    />
                    <PrintField
                        label="Nächste Überprüfung"
                        value={formatDateDE(d.naechsteUeberpruefungAm)}
                    />
                    <PrintField
                        label="Anlass-Codes"
                        value={(d.anlassCodes ?? []).length ? d.anlassCodes?.join(", ") : "—"}
                        className="col-span-2"
                    />
                </div>
            </PrintSection>

            <PrintSection title="Meta">
                <div className="grid grid-cols-2 gap-4">
                    <PrintField label="Erfasst von Rolle" value={normalize(d.erfasstVonRolle)} />
                    <PrintField
                        label="Meldeweg"
                        value={
                            d.meldeweg
                                ? d.meldewegSonstiges
                                    ? `${d.meldeweg} (${d.meldewegSonstiges})`
                                    : d.meldeweg
                                : "—"
                        }
                    />
                    <PrintField
                        label="Meldende Stelle Kontakt"
                        value={normalize(d.meldendeStelleKontakt)}
                    />
                    <PrintField label="Datenbasis" value={normalize(d.datenbasis)} />
                    <PrintField
                        label="Einwilligung vorhanden"
                        value={normalize(d.einwilligungVorhanden)}
                    />
                    <PrintField
                        label="Schweigepflichtentbindung vorhanden"
                        value={normalize(d.schweigepflichtentbindungVorhanden)}
                    />
                </div>
            </PrintSection>

            <PrintSection title="Fach">
                <div className="grid grid-cols-2 gap-4">
                    <PrintField label="Ampel" value={normalize(d.fachAmpel)} />
                    <PrintField label="Abweichung zur Auto" value={normalize(d.abweichungZurAuto)} />
                    <PrintField label="Fachtext" value={normalize(d.fachText)} className="col-span-2" />
                    <PrintField
                        label="Abweichungs-Begründung"
                        value={normalize(d.abweichungsBegruendung)}
                        className="col-span-2"
                    />
                </div>
            </PrintSection>

            <PrintSection title="Akut">
                <div className="grid grid-cols-2 gap-4">
                    <PrintField
                        label="Gefahr im Verzug"
                        value={d.akutGefahrImVerzug ? "Ja" : "Nein"}
                    />
                    <PrintField
                        label="Notruf erforderlich"
                        value={normalize(d.akutNotrufErforderlich)}
                    />
                    <PrintField
                        label="Kind sicher untergebracht"
                        value={normalize(d.akutKindSicherUntergebracht)}
                    />
                    <PrintField
                        label="Begründung"
                        value={normalize(d.akutBegruendung)}
                        className="col-span-2"
                    />
                </div>

                <div className="mt-5">
                    <h3 className="mb-3 text-[12pt] font-semibold">Jugendamt</h3>
                    {d.jugendamt ? (
                        <div className="grid grid-cols-2 gap-4">
                            <PrintField label="Informiert" value={normalize(d.jugendamt.informiert)} />
                            <PrintField label="Kontakt am" value={formatDateTimeDE(d.jugendamt.kontaktAm)} />
                            <PrintField label="Kontaktart" value={normalize(d.jugendamt.kontaktart)} />
                            <PrintField label="Aktenzeichen" value={normalize(d.jugendamt.aktenzeichen)} />
                            <PrintField
                                label="Begründung"
                                value={normalize(d.jugendamt.begruendung)}
                                className="col-span-2"
                            />
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500">—</div>
                    )}
                </div>
            </PrintSection>

            <PrintSection title="Planung">
                <div className="grid grid-cols-2 gap-4">
                    <PrintField
                        label="Verantwortliche Fachkraft"
                        value={normalize(d.verantwortlicheFachkraftUserId)}
                    />
                    <PrintField
                        label="Nächste Überprüfung am"
                        value={formatDateDE(d.naechsteUeberpruefungAm)}
                    />
                    <PrintField
                        label="Zusammenfassung"
                        value={normalize(d.zusammenfassung)}
                        className="col-span-2"
                    />
                </div>
            </PrintSection>

            <PrintSection title="Beobachtungen" pageBreak>
                <PrintTable
                    columns={[
                        { key: "zeit", label: "Zeitpunkt" },
                        { key: "ort", label: "Ort" },
                        { key: "quelle", label: "Quelle" },
                        { key: "text", label: "Text" },
                    ]}
                    rows={(d.observations ?? []).map((o) => ({
                        zeit: formatDateTimeDE(o.zeitpunkt),
                        ort: o.ortSonstiges ? `${o.ort ?? "—"} (${o.ortSonstiges})` : o.ort ?? "—",
                        quelle: o.quelle ?? "—",
                        text: (
                            <div>
                                <div>{o.text ?? "—"}</div>
                                <div className="print-small mt-1">
                                    Zitat: {o.woertlichesZitat ?? "—"}
                                </div>
                                <div className="print-small">
                                    Körperbefund: {o.koerperbefund ?? "—"}
                                </div>
                                <div className="print-small">
                                    Verhalten Kind: {o.verhaltenKind ?? "—"}
                                </div>
                                <div className="print-small">
                                    Verhalten Bezug: {o.verhaltenBezug ?? "—"}
                                </div>
                            </div>
                        ),
                    }))}
                />
            </PrintSection>

            <PrintSection title="Kontakte">
                <PrintTable
                    columns={[
                        { key: "mit", label: "Kontakt mit" },
                        { key: "am", label: "Kontakt am" },
                        { key: "status", label: "Status" },
                        { key: "ergebnis", label: "Ergebnis" },
                        { key: "notiz", label: "Notiz" },
                    ]}
                    rows={(d.contacts ?? []).map((c) => ({
                        mit: c.kontaktMit ?? "—",
                        am: formatDateTimeDE(c.kontaktAm),
                        status: c.status ?? "—",
                        ergebnis: c.ergebnis ?? "—",
                        notiz: c.notiz ?? "—",
                    }))}
                />
            </PrintSection>

            <PrintSection title="Extern">
                <PrintTable
                    columns={[
                        { key: "stelle", label: "Stelle" },
                        { key: "am", label: "Am" },
                        { key: "sonst", label: "Stelle sonstiges" },
                        { key: "ergebnis", label: "Ergebnis" },
                        { key: "begruendung", label: "Begründung" },
                    ]}
                    rows={(d.extern ?? []).map((x) => ({
                        stelle: x.stelle ?? "—",
                        am: formatDateTimeDE(x.am),
                        sonst: x.stelleSonstiges ?? "—",
                        ergebnis: x.ergebnis ?? "—",
                        begruendung: x.begruendung ?? "—",
                    }))}
                />
            </PrintSection>

            <PrintSection title="Anhänge">
                <PrintTable
                    columns={[
                        { key: "titel", label: "Titel" },
                        { key: "typ", label: "Typ" },
                        { key: "sicht", label: "Sichtbarkeit" },
                        { key: "file", label: "FileId" },
                        { key: "besch", label: "Beschreibung" },
                    ]}
                    rows={(d.attachments ?? []).map((a) => ({
                        titel: a.titel ?? "—",
                        typ: a.typ ?? "—",
                        sicht: a.sichtbarkeit ?? "—",
                        file: a.fileId ?? "—",
                        besch: a.beschreibung ?? "—",
                    }))}
                />
            </PrintSection>

            <PrintSection title="Audit" pageBreak>
                <div className="grid grid-cols-2 gap-4 mb-5">
                    <PrintField label="Submitted am" value={formatDateTimeDE(d.submittedAt)} />
                    <PrintField label="Submitted von" value={normalize(d.submittedByDisplayName)} />
                    <PrintField label="Freigabe am" value={formatDateTimeDE(d.freigabeAm)} />
                    <PrintField label="Freigabe von" value={normalize(d.freigabeVonDisplayName)} />
                </div>

                <PrintTable
                    columns={[
                        { key: "section", label: "Sektion" },
                        { key: "field", label: "Feld" },
                        { key: "at", label: "Zeit" },
                        { key: "old", label: "Alt" },
                        { key: "neu", label: "Neu" },
                        { key: "reason", label: "Grund" },
                        { key: "by", label: "Von" },
                    ]}
                    rows={(d.changes ?? []).map((c) => ({
                        section: c.section ?? "—",
                        field: c.fieldPath ?? "—",
                        at: formatDateTimeDE(c.changedAt),
                        old: c.oldValue ?? "—",
                        neu: c.newValue ?? "—",
                        reason: c.reason ?? "—",
                        by: c.changedByDisplayName ?? "—",
                    }))}
                />
            </PrintSection>
        </article>
    );
}