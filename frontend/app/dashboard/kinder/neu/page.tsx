"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { Toaster, toast } from "sonner";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";

type Gender = "MAENNLICH" | "WEIBLICH" | "DIVERS" | "UNBEKANNT";
type Beziehung =
    | "MUTTER"
    | "VATER"
    | "SORGEBERECHTIGT"
    | "PFLEGEMUTTER"
    | "PFLEGEVATER"
    | "STIEFMUTTER"
    | "STIEFVATER"
    | "GROSSMUTTER"
    | "GROSSVATER"
    | "SONSTIGE";
type Sorgerecht =
    | "ALLEIN"
    | "GEMEINSAM"
    | "KEIN"
    | "AMTSPFLEGSCHAFT"
    | "VORMUNDSCHAFT"
    | "UNGEKLAERT";

type CreateKindCompleteRequest = {
    kind: {
        vorname: string;
        nachname: string;
        geburtsdatum: string | null;
        gender: Gender;
        foerderbedarf: boolean;
        foerderbedarfDetails: string | null;
        gesundheitsHinweise: string | null;

        strasse: string | null;
        hausnummer: string | null;
        plz: string | null;
        ort: string | null;

        ownerEinrichtungOrgUnitId: number | null;
    };
    bezugspersonen: Array<{
        existingBezugspersonId: number | null;
        create: {
            vorname: string;
            nachname: string;
            geburtsdatum: string | null;
            gender: Gender;
            telefon: string | null;
            kontaktEmail: string | null;
            strasse: string | null;
            hausnummer: string | null;
            plz: string | null;
            ort: string | null;
            beziehung: Beziehung;
        } | null;

        beziehung: Beziehung;
        sorgerecht: Sorgerecht;
        validFrom: string;
        hauptkontakt: boolean;
        lebtImHaushalt: boolean;
    }>;
};

type CreateKindResponse = { kindId: number };

type BezugspersonListItem = {
    id: number;
    displayName: string;
    geburtsdatum: string | null;
    telefon: string | null;
    kontaktEmail: string | null;
};

type BezugspersonSearchResponse = {
    items: any[];
    total: number;
    page: number;
    size: number;
};

type BezugspersonDetail = {
    id: number;
    displayName?: string | null;
    vorname?: string | null;
    nachname?: string | null;
    geburtsdatum?: string | null;
    telefon?: string | null;
    kontaktEmail?: string | null;
    strasse?: string | null;
    hausnummer?: string | null;
    plz?: string | null;
    ort?: string | null;
    adresse?: {
        strasse?: string | null;
        hausnummer?: string | null;
        plz?: string | null;
        ort?: string | null;
    } | null;
};

type KindSearchResponse = {
    items: any[];
    total: number;
    page: number;
    size: number;
};

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
    { value: "MAENNLICH", label: "Männlich" },
    { value: "WEIBLICH", label: "Weiblich" },
    { value: "DIVERS", label: "Divers" },
    { value: "UNBEKANNT", label: "Unbekannt" },
];

const BEZIEHUNG_OPTIONS: Array<{ value: Beziehung; label: string }> = [
    { value: "MUTTER", label: "Mutter" },
    { value: "VATER", label: "Vater" },
    { value: "SORGEBERECHTIGT", label: "Sorgeberechtigt" },
    { value: "PFLEGEMUTTER", label: "Pflegemutter" },
    { value: "PFLEGEVATER", label: "Pflegevater" },
    { value: "STIEFMUTTER", label: "Stiefmutter" },
    { value: "STIEFVATER", label: "Stiefvater" },
    { value: "GROSSMUTTER", label: "Großmutter" },
    { value: "GROSSVATER", label: "Großvater" },
    { value: "SONSTIGE", label: "Sonstige" },
];

const SORGERECHT_OPTIONS: Array<{ value: Sorgerecht; label: string }> = [
    { value: "ALLEIN", label: "Allein" },
    { value: "GEMEINSAM", label: "Gemeinsam" },
    { value: "KEIN", label: "Kein" },
    { value: "AMTSPFLEGSCHAFT", label: "Amtspflegschaft" },
    { value: "VORMUNDSCHAFT", label: "Vormundschaft" },
    { value: "UNGEKLAERT", label: "Ungeklärt" },
];

function StepPill({ active, label }: { active: boolean; label: string }) {
    return (
        <div
            className={[
                "rounded-full px-3 py-1 text-xs font-semibold border",
                active
                    ? "bg-accent text-accent-foreground border-border"
                    : "bg-background text-muted-foreground border-border",
            ].join(" ")}
        >
            {label}
        </div>
    );
}

function Field({
                   label,
                   htmlFor,
                   children,
               }: {
    label: string;
    htmlFor?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1">
            <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
                {label}
            </Label>
            {children}
        </div>
    );
}

// ---------- helpers ----------
function fmtDate(iso?: string | null) {
    if (!iso) return "—";
    const [y, m, d] = String(iso).split("-");
    if (!y || !m || !d) return String(iso);
    return `${d}.${m}.${y}`;
}
function fmtYesNo(v?: boolean | null) {
    if (v === true) return "Ja";
    if (v === false) return "Nein";
    return "—";
}
function sameIgnoreCase(a: string, b: string) {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function normalizeBpListItem(raw: any): BezugspersonListItem {
    return {
        id: Number(raw?.id),
        displayName:
            String(raw?.displayName ?? raw?.name ?? raw?.fullName ?? "").trim() ||
            "(ohne Namen)",
        geburtsdatum: raw?.geburtsdatum ?? raw?.birthDate ?? raw?.dateOfBirth ?? null,
        telefon: raw?.telefon ?? raw?.phone ?? null,
        kontaktEmail: raw?.kontaktEmail ?? raw?.email ?? null,
    };
}

function normalizeBpDetail(raw: any): BezugspersonDetail {
    return {
        id: Number(raw?.id),
        displayName: raw?.displayName ?? null,
        vorname: raw?.vorname ?? null,
        nachname: raw?.nachname ?? null,
        geburtsdatum: raw?.geburtsdatum ?? null,
        telefon: raw?.telefon ?? null,
        kontaktEmail: raw?.kontaktEmail ?? null,
        strasse: raw?.strasse ?? raw?.adresse?.strasse ?? null,
        hausnummer: raw?.hausnummer ?? raw?.adresse?.hausnummer ?? null,
        plz: raw?.plz ?? raw?.adresse?.plz ?? null,
        ort: raw?.ort ?? raw?.adresse?.ort ?? null,
        adresse: raw?.adresse ?? null,
    };
}

function addrKey(a?: {
    strasse?: string | null;
    hausnummer?: string | null;
    plz?: string | null;
    ort?: string | null;
}) {
    const s = (a?.strasse ?? "").trim().toLowerCase();
    const h = (a?.hausnummer ?? "").trim().toLowerCase();
    const p = (a?.plz ?? "").trim().toLowerCase();
    const o = (a?.ort ?? "").trim().toLowerCase();
    return `${s}|${h}|${p}|${o}`;
}

function formatAddressLines(a: {
    strasse?: string | null;
    hausnummer?: string | null;
    plz?: string | null;
    ort?: string | null;
}) {
    const line1 = `${a.strasse ?? ""} ${a.hausnummer ?? ""}`.trim();
    const line2 = `${a.plz ?? ""} ${a.ort ?? ""}`.trim();
    const l1 = line1 || "—";
    const l2 = line2 || "—";
    return { l1, l2 };
}

function toastMissing(missing: string[]) {
    const shown = missing.slice(0, 4);
    const rest = missing.length - shown.length;

    toast.error("Bitte Pflichtfelder ergänzen", {
        description: (
            <div className="text-sm">
                <ul className="list-disc pl-5">
                    {shown.map((x) => (
                        <li key={x}>{x}</li>
                    ))}
                </ul>
                {rest > 0 ? (
                    <div className="mt-1 text-xs text-muted-foreground">+{rest} weitere</div>
                ) : null}
            </div>
        ),
        duration: 5000,
    });
}

// prettier confirmation rows (no truncation)
function ConfirmRow({
                        label,
                        children,
                    }: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-[120px_1fr] gap-3 py-2 sm:grid-cols-[140px_1fr]">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-sm font-medium leading-snug break-words whitespace-pre-wrap">
                {children}
            </div>
        </div>
    );
}

function ConfirmCard({
                         title,
                         badge,
                         children,
                     }: {
    title: string;
    badge?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border bg-background">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="text-sm font-semibold">{title}</div>
                {badge ? <div className="shrink-0">{badge}</div> : null}
            </div>
            <Separator />
            <div className="px-4 py-3">{children}</div>
        </div>
    );
}

export default function KindWizardPage() {
    const router = useRouter();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // Confirm Modal
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Kind
    const [kVorname, setKVorname] = useState("");
    const [kNachname, setKNachname] = useState("");
    const [kGeb, setKGeb] = useState<string>("");
    const [kGender, setKGender] = useState<Gender>("UNBEKANNT");

    // Adresse Kind (pflicht)
    const [kStr, setKStr] = useState("");
    const [kHnr, setKHnr] = useState("");
    const [kPlz, setKPlz] = useState("");
    const [kOrt, setKOrt] = useState("");

    const [foerderbedarf, setFoerderbedarf] = useState(false);
    const [foerderbedarfDetails, setFoerderbedarfDetails] = useState("");
    const [gesundheit, setGesundheit] = useState("");

    // Bezugsperson Link Meta (alles Pflicht)
    const [bpBeziehung, setBpBeziehung] = useState<Beziehung>("MUTTER");
    const [bpSorgerecht, setBpSorgerecht] = useState<Sorgerecht>("UNGEKLAERT");
    const [bpValidFrom, setBpValidFrom] = useState<string>(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    });

    const [bpHaupt, setBpHaupt] = useState(true);
    const [bpHaushalt, setBpHaushalt] = useState(false);

    // Neu erfassen
    const [bpVorname, setBpVorname] = useState("");
    const [bpNachname, setBpNachname] = useState("");
    const [bpGeb, setBpGeb] = useState<string>("");
    const [bpGender, setBpGender] = useState<Gender>("UNBEKANNT");
    const [bpTelefon, setBpTelefon] = useState("");
    const [bpEmail, setBpEmail] = useState("");
    const [bpStr, setBpStr] = useState("");
    const [bpHnr, setBpHnr] = useState("");
    const [bpPlz, setBpPlz] = useState("");
    const [bpOrt, setBpOrt] = useState("");

    // Bestehend vs Neu
    const [useExistingBp, setUseExistingBp] = useState(false);
    const [selectedBp, setSelectedBp] = useState<BezugspersonListItem | null>(null);
    const [selectedBpDetail, setSelectedBpDetail] = useState<BezugspersonDetail | null>(null);

    // Existing BP search
    const [bpOpen, setBpOpen] = useState(false);
    const [bpQuery, setBpQuery] = useState("");
    const [bpLoading, setBpLoading] = useState(false);
    const [bpItems, setBpItems] = useState<BezugspersonListItem[]>([]);
    const [bpTotal, setBpTotal] = useState(0);
    const [bpPage, setBpPage] = useState(0);
    const bpSize = 20;

    // If you have it from session/context: set it here
    const einrichtungId: number | null = null;

    // --- Autofocus refs ---
    const refKVorname = useRef<HTMLInputElement | null>(null);
    const refFoerderDetails = useRef<HTMLTextAreaElement | null>(null);
    const refHinweise = useRef<HTMLTextAreaElement | null>(null);
    const refBpVorname = useRef<HTMLInputElement | null>(null);
    const refBpSearchBtn = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        const t = window.setTimeout(() => {
            if (step === 1) refKVorname.current?.focus();
            if (step === 2) {
                if (foerderbedarf) refFoerderDetails.current?.focus();
                else refHinweise.current?.focus();
            }
            if (step === 3) {
                if (useExistingBp) refBpSearchBtn.current?.focus();
                else refBpVorname.current?.focus();
            }
        }, 0);
        return () => window.clearTimeout(t);
    }, [step, foerderbedarf, useExistingBp]);

    // Address sync/clear for NEW BP when lebtImHaushalt active
    const bpAddressLockedNew = !useExistingBp && bpHaushalt;

    useEffect(() => {
        if (useExistingBp) return;

        if (bpHaushalt) {
            setBpStr(kStr);
            setBpHnr(kHnr);
            setBpPlz(kPlz);
            setBpOrt(kOrt);
        } else {
            setBpStr("");
            setBpHnr("");
            setBpPlz("");
            setBpOrt("");
        }
    }, [useExistingBp, bpHaushalt, kStr, kHnr, kPlz, kOrt]);

    // Existing BP selected -> load detail to compare address
    const [haushaltDisabledReason, setHaushaltDisabledReason] = useState<string | null>(null);

    async function loadSelectedBpDetail(id: number) {
        const res = await apiFetch<BezugspersonDetail>(`/bezugspersonen/${id}`, { method: "GET" });
        return normalizeBpDetail(res);
    }

    useEffect(() => {
        let cancelled = false;

        async function run() {
            if (!useExistingBp || !selectedBp) {
                setSelectedBpDetail(null);
                setHaushaltDisabledReason(null);
                return;
            }
            try {
                const detail = await loadSelectedBpDetail(selectedBp.id);
                if (cancelled) return;
                setSelectedBpDetail(detail);

                const kindA = addrKey({ strasse: kStr, hausnummer: kHnr, plz: kPlz, ort: kOrt });
                const bpA = addrKey({
                    strasse: detail.strasse,
                    hausnummer: detail.hausnummer,
                    plz: detail.plz,
                    ort: detail.ort,
                });

                const identical = kindA === bpA && kindA !== "|||";
                if (!identical) {
                    setHaushaltDisabledReason("Adresse abweichend");
                    if (bpHaushalt) setBpHaushalt(false);
                } else {
                    setHaushaltDisabledReason(null);
                }
            } catch {
                setSelectedBpDetail(null);
                setHaushaltDisabledReason("Adresse unbekannt");
                if (bpHaushalt) setBpHaushalt(false);
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [useExistingBp, selectedBp, kStr, kHnr, kPlz, kOrt, bpHaushalt]);

    const haushaltDisabled = useExistingBp && selectedBp != null && haushaltDisabledReason != null;

    // Debounce server search
    const bpDebounceRef = useRef<number | null>(null);

    function scheduleBpSearch(nextQuery: string) {
        if (bpDebounceRef.current) window.clearTimeout(bpDebounceRef.current);
        bpDebounceRef.current = window.setTimeout(() => {
            runBpSearch(nextQuery, 0, true);
        }, 250);
    }

    function mergeDedup<T extends { id: number }>(prev: T[], next: T[]) {
        const map = new Map<number, T>();
        [...prev, ...next].forEach((x) => map.set(x.id, x));
        return Array.from(map.values());
    }

    async function runBpSearch(q: string, page: number, replace: boolean) {
        setBpLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("q", q ?? "");
            params.set("page", String(page));
            params.set("size", String(bpSize));
            if (einrichtungId != null) params.set("einrichtungId", String(einrichtungId));

            const res = await apiFetch<BezugspersonSearchResponse>(`/bezugspersonen?${params.toString()}`, {
                method: "GET",
            });

            const normalized = (res.items ?? []).map(normalizeBpListItem);

            setBpTotal(res.total ?? 0);
            setBpPage(res.page ?? page);
            setBpItems((prev) => (replace ? normalized : mergeDedup(prev, normalized)));
        } finally {
            setBpLoading(false);
        }
    }

    useEffect(() => {
        if (!bpOpen) return;
        runBpSearch(bpQuery, 0, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bpOpen]);

    // --------- Validation ---------
    const canNext1 = useMemo(() => {
        return (
            kVorname.trim().length > 0 &&
            kNachname.trim().length > 0 &&
            kGeb.trim().length > 0 &&
            kGender !== "UNBEKANNT" &&
            kStr.trim().length > 0 &&
            kHnr.trim().length > 0 &&
            kPlz.trim().length > 0 &&
            kOrt.trim().length > 0
        );
    }, [kVorname, kNachname, kGeb, kGender, kStr, kHnr, kPlz, kOrt]);

    const canNext3 = useMemo(() => {
        if (!bpValidFrom.trim()) return false;
        if (!bpBeziehung) return false;
        if (!bpSorgerecht) return false;

        if (useExistingBp) return selectedBp != null;

        return (
            bpVorname.trim().length > 0 &&
            bpNachname.trim().length > 0 &&
            bpGeb.trim().length > 0 &&
            bpGender !== "UNBEKANNT"
        );
    }, [
        bpValidFrom,
        bpBeziehung,
        bpSorgerecht,
        useExistingBp,
        selectedBp,
        bpVorname,
        bpNachname,
        bpGeb,
        bpGender,
    ]);

    function collectMissingAll(): string[] {
        const missing: string[] = [];

        if (!kVorname.trim()) missing.push("Kind: Vorname");
        if (!kNachname.trim()) missing.push("Kind: Nachname");
        if (!kGeb.trim()) missing.push("Kind: Geburtsdatum");
        if (kGender === "UNBEKANNT") missing.push("Kind: Geschlecht (nicht 'Unbekannt')");
        if (!kStr.trim()) missing.push("Kind: Straße");
        if (!kHnr.trim()) missing.push("Kind: Hausnr.");
        if (!kPlz.trim()) missing.push("Kind: PLZ");
        if (!kOrt.trim()) missing.push("Kind: Ort");

        if (!bpBeziehung) missing.push("Bezugsperson: Beziehung");
        if (!bpSorgerecht) missing.push("Bezugsperson: Sorgerecht");
        if (!bpValidFrom.trim()) missing.push("Bezugsperson: Gültig ab");

        if (useExistingBp) {
            if (!selectedBp) missing.push("Bezugsperson: Auswahl (bestehend)");
        } else {
            if (!bpVorname.trim()) missing.push("Bezugsperson: Vorname");
            if (!bpNachname.trim()) missing.push("Bezugsperson: Nachname");
            if (!bpGeb.trim()) missing.push("Bezugsperson: Geburtsdatum");
            if (bpGender === "UNBEKANNT") missing.push("Bezugsperson: Geschlecht (nicht 'Unbekannt')");
        }

        if (haushaltDisabled && bpHaushalt) {
            missing.push("Bezugsperson: Im Haushalt (nicht möglich bei abweichender Adresse)");
        }

        return missing;
    }

    // --------- Duplicate checks (best-effort via search endpoints) ---------
    function normalizeKindListItem(raw: any) {
        return {
            id: Number(raw?.id),
            vorname: String(raw?.vorname ?? raw?.firstName ?? "").trim(),
            nachname: String(raw?.nachname ?? raw?.lastName ?? "").trim(),
            geburtsdatum: raw?.geburtsdatum ?? raw?.birthDate ?? raw?.dateOfBirth ?? null,
            displayName: String(raw?.displayName ?? raw?.name ?? "").trim(),
        };
    }

    async function checkKindDuplicate(): Promise<boolean> {
        if (!kVorname.trim() || !kNachname.trim() || !kGeb.trim()) return false;

        const q = `${kVorname.trim()} ${kNachname.trim()}`;
        const params = new URLSearchParams();
        params.set("q", q);
        params.set("page", "0");
        params.set("size", "20");

        try {
            const res = await apiFetch<KindSearchResponse>(`/api/kinder?${params.toString()}`, {
                method: "GET",
            });
            const items = (res.items ?? []).map(normalizeKindListItem);

            return items.some((x) => {
                const nameMatch =
                    (x.vorname &&
                        x.nachname &&
                        sameIgnoreCase(x.vorname, kVorname) &&
                        sameIgnoreCase(x.nachname, kNachname)) ||
                    (x.displayName &&
                        sameIgnoreCase(x.displayName, `${kVorname.trim()} ${kNachname.trim()}`));
                const dateMatch = String(x.geburtsdatum ?? "") === String(kGeb);
                return nameMatch && dateMatch;
            });
        } catch {
            return false;
        }
    }

    async function checkBpDuplicateNew(): Promise<boolean> {
        if (useExistingBp) return false;
        if (!bpVorname.trim() || !bpNachname.trim() || !bpGeb.trim()) return false;

        const q = `${bpVorname.trim()} ${bpNachname.trim()}`;
        const params = new URLSearchParams();
        params.set("q", q);
        params.set("page", "0");
        params.set("size", "20");
        if (einrichtungId != null) params.set("einrichtungId", String(einrichtungId));

        try {
            const res = await apiFetch<BezugspersonSearchResponse>(`/bezugspersonen?${params.toString()}`, {
                method: "GET",
            });
            const items = (res.items ?? []).map(normalizeBpListItem);

            const targetName = `${bpVorname.trim()} ${bpNachname.trim()}`;
            return items.some(
                (x) =>
                    sameIgnoreCase(x.displayName, targetName) &&
                    String(x.geburtsdatum ?? "") === String(bpGeb)
            );
        } catch {
            return false;
        }
    }

    // --------- Submit flow (Confirm modal first) ---------
    async function openConfirm() {
        setErr(null);

        const missing = collectMissingAll();
        if (missing.length) {
            toastMissing(missing);
            return;
        }

        if (haushaltDisabled && bpHaushalt) {
            toast.error("Im Haushalt nicht möglich", {
                description: "Adresse von Kind und Bezugsperson ist abweichend.",
                duration: 5000,
            });
            return;
        }

        const [kindDup, bpDup] = await Promise.all([
            checkKindDuplicate(),
            checkBpDuplicateNew(),
        ]);

        if (kindDup) {
            toast.error("Mögliche Dublette", {
                description:
                    "Ein Kind mit gleichem Namen und Geburtsdatum existiert bereits.",
                duration: 5000,
            });
            return;
        }
        if (bpDup) {
            toast.error("Mögliche Dublette", {
                description:
                    "Eine Bezugsperson mit gleichem Namen und Geburtsdatum existiert bereits.",
                duration: 5000,
            });
            return;
        }

        setConfirmOpen(true);
    }

    async function submit() {
        setErr(null);
        setLoading(true);
        try {
            const payload: CreateKindCompleteRequest = {
                kind: {
                    vorname: kVorname.trim(),
                    nachname: kNachname.trim(),
                    geburtsdatum: kGeb ? kGeb : null,
                    gender: kGender,
                    foerderbedarf,
                    foerderbedarfDetails: foerderbedarf
                        ? foerderbedarfDetails.trim() || null
                        : null,
                    gesundheitsHinweise: gesundheit.trim() || null,

                    strasse: kStr.trim() || null,
                    hausnummer: kHnr.trim() || null,
                    plz: kPlz.trim() || null,
                    ort: kOrt.trim() || null,

                    ownerEinrichtungOrgUnitId: null,
                },
                bezugspersonen: [
                    useExistingBp
                        ? {
                            existingBezugspersonId: selectedBp!.id,
                            create: null,
                            beziehung: bpBeziehung,
                            sorgerecht: bpSorgerecht,
                            validFrom: bpValidFrom,
                            hauptkontakt: bpHaupt,
                            lebtImHaushalt: bpHaushalt,
                        }
                        : {
                            existingBezugspersonId: null,
                            create: {
                                vorname: bpVorname.trim(),
                                nachname: bpNachname.trim(),
                                geburtsdatum: bpGeb ? bpGeb : null,
                                gender: bpGender,
                                telefon: bpTelefon.trim() || null,
                                kontaktEmail: bpEmail.trim() || null, // optional
                                strasse: bpStr.trim() || null,
                                hausnummer: bpHnr.trim() || null,
                                plz: bpPlz.trim() || null,
                                ort: bpOrt.trim() || null,
                                beziehung: bpBeziehung,
                            },
                            beziehung: bpBeziehung,
                            sorgerecht: bpSorgerecht,
                            validFrom: bpValidFrom,
                            hauptkontakt: bpHaupt,
                            lebtImHaushalt: bpHaushalt,
                        },
                ],
            };

            const res = await apiFetch<CreateKindResponse>("/api/kinder/complete", {
                method: "POST",
                body: payload,
            });

            setConfirmOpen(false);
            router.push(`/dashboard/kinder/${res.kindId}`);
        } catch (e: any) {
            setErr(e?.message || "Konnte Kind nicht anlegen.");
            toast.error("Speichern fehlgeschlagen", {
                description: e?.message || "Bitte erneut versuchen.",
                duration: 5000,
            });
        } finally {
            setLoading(false);
        }
    }

    // --------- Confirmation view model (better addresses) ---------
    const kindName = `${kVorname} ${kNachname}`.trim() || "—";
    const kindAddrLines = formatAddressLines({
        strasse: kStr,
        hausnummer: kHnr,
        plz: kPlz,
        ort: kOrt,
    });

    const bpMode = useExistingBp ? "BESTEHEND" : "NEU";

    const bpName =
        bpMode === "BESTEHEND"
            ? selectedBp?.displayName ?? "—"
            : `${bpVorname} ${bpNachname}`.trim() || "—";

    const bpGebShow =
        bpMode === "BESTEHEND"
            ? fmtDate(selectedBp?.geburtsdatum ?? null)
            : fmtDate(bpGeb || null);

    const bpPhoneShow =
        bpMode === "BESTEHEND"
            ? selectedBp?.telefon?.trim() || "—"
            : bpTelefon.trim() || "—";

    const bpMailShow =
        bpMode === "BESTEHEND"
            ? selectedBp?.kontaktEmail?.trim() || "—"
            : bpEmail.trim() || "—";

    const bpAddrLines =
        bpMode === "BESTEHEND"
            ? formatAddressLines({
                strasse: selectedBpDetail?.strasse ?? "",
                hausnummer: selectedBpDetail?.hausnummer ?? "",
                plz: selectedBpDetail?.plz ?? "",
                ort: selectedBpDetail?.ort ?? "",
            })
            : formatAddressLines({
                strasse: bpStr,
                hausnummer: bpHnr,
                plz: bpPlz,
                ort: bpOrt,
            });

    return (
        <AuthGate>
            <Toaster position="top-center" duration={5000} richColors closeButton />

            <div className="min-h-screen bg-background overflow-x-hidden">
                <Topbar title="Kind anlegen" />

                <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-4 sm:px-6 md:px-8">
                    {err ? (
                        <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                            {err}
                        </div>
                    ) : null}

                    <div className="mb-4 flex flex-wrap gap-2">
                        <StepPill active={step === 1} label="1 · Kind" />
                        <StepPill active={step === 2} label="2 · Hinweise" />
                        <StepPill active={step === 3} label="3 · Bezugsperson" />
                    </div>

                    {/* STEP 1 */}
                    {step === 1 ? (
                        <Card>
                            <CardHeader>
                                <div className="text-sm font-semibold">Kind: Basisdaten</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Vorname/Nachname, Geburtsdatum, Geschlecht und Adresse sind Pflicht.
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="Vorname *" htmlFor="k-vorname">
                                            <Input
                                                id="k-vorname"
                                                ref={refKVorname}
                                                value={kVorname}
                                                onChange={(e) => setKVorname(e.target.value)}
                                            />
                                        </Field>

                                        <Field label="Nachname *" htmlFor="k-nachname">
                                            <Input
                                                id="k-nachname"
                                                value={kNachname}
                                                onChange={(e) => setKNachname(e.target.value)}
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="Geburtsdatum *" htmlFor="k-geb">
                                            <Input
                                                id="k-geb"
                                                type="date"
                                                value={kGeb}
                                                onChange={(e) => setKGeb(e.target.value)}
                                            />
                                        </Field>

                                        <Field label="Geschlecht *">
                                            <Select value={kGender} onValueChange={(v) => setKGender(v as Gender)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Bitte wählen" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {GENDER_OPTIONS.map((o) => (
                                                        <SelectItem key={o.value} value={o.value}>
                                                            {o.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {kGender === "UNBEKANNT" ? (
                                                <div className="mt-1 text-[11px] text-destructive">
                                                    Bitte Geschlecht auswählen (nicht „Unbekannt“).
                                                </div>
                                            ) : null}
                                        </Field>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="text-xs font-semibold text-muted-foreground">Adresse</div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="Straße *" htmlFor="k-str">
                                            <Input id="k-str" value={kStr} onChange={(e) => setKStr(e.target.value)} />
                                        </Field>

                                        <Field label="Hausnr. *" htmlFor="k-hnr">
                                            <Input id="k-hnr" value={kHnr} onChange={(e) => setKHnr(e.target.value)} />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Field label="PLZ *" htmlFor="k-plz">
                                            <Input id="k-plz" value={kPlz} onChange={(e) => setKPlz(e.target.value)} />
                                        </Field>

                                        <Field label="Ort *" htmlFor="k-ort">
                                            <Input id="k-ort" value={kOrt} onChange={(e) => setKOrt(e.target.value)} />
                                        </Field>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => router.push("/dashboard/kinder")}
                                        disabled={loading}
                                    >
                                        Abbrechen
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            const missing: string[] = [];
                                            if (!kVorname.trim()) missing.push("Kind: Vorname");
                                            if (!kNachname.trim()) missing.push("Kind: Nachname");
                                            if (!kGeb.trim()) missing.push("Kind: Geburtsdatum");
                                            if (kGender === "UNBEKANNT") missing.push("Kind: Geschlecht (nicht 'Unbekannt')");
                                            if (!kStr.trim()) missing.push("Kind: Straße");
                                            if (!kHnr.trim()) missing.push("Kind: Hausnr.");
                                            if (!kPlz.trim()) missing.push("Kind: PLZ");
                                            if (!kOrt.trim()) missing.push("Kind: Ort");

                                            if (missing.length) {
                                                toastMissing(missing);
                                                return;
                                            }
                                            setStep(2);
                                        }}
                                        disabled={loading}
                                    >
                                        Weiter
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}

                    {/* STEP 2 */}
                    {step === 2 ? (
                        <Card>
                            <CardHeader>
                                <div className="text-sm font-semibold">Hinweise</div>
                                <div className="mt-1 text-xs text-muted-foreground">Optional, aber hilfreich.</div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="foerderbedarf"
                                        checked={foerderbedarf}
                                        onCheckedChange={(v) => setFoerderbedarf(Boolean(v))}
                                    />
                                    <Label htmlFor="foerderbedarf" className="text-sm">
                                        Förderbedarf vorhanden
                                    </Label>
                                </div>

                                {foerderbedarf ? (
                                    <Field label="Förderbedarf Details" htmlFor="foerderbedarfDetails">
                                        <Textarea
                                            id="foerderbedarfDetails"
                                            ref={refFoerderDetails}
                                            value={foerderbedarfDetails}
                                            onChange={(e) => setFoerderbedarfDetails(e.target.value)}
                                            className="min-h-[96px]"
                                            placeholder="z.B. Logopädie, Motorik, Sprache…"
                                        />
                                    </Field>
                                ) : null}

                                <Field label="Gesundheits-/Entwicklungshinweise" htmlFor="gesundheit">
                                    <Textarea
                                        id="gesundheit"
                                        ref={!foerderbedarf ? refHinweise : undefined}
                                        value={gesundheit}
                                        onChange={(e) => setGesundheit(e.target.value)}
                                        className="min-h-[96px]"
                                        placeholder="Optional…"
                                    />
                                </Field>

                                <div className="flex items-center justify-between pt-2">
                                    <Button variant="secondary" onClick={() => setStep(1)} disabled={loading}>
                                        Zurück
                                    </Button>
                                    <Button onClick={() => setStep(3)} disabled={loading}>
                                        Weiter
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}

                    {/* STEP 3 */}
                    {step === 3 ? (
                        <Card>
                            <CardHeader>
                                <div className="text-sm font-semibold">Bezugsperson (mind. 1)</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Vor dem Speichern bitte im Bestätigungs-Modal prüfen.
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <Field label="Beziehung *">
                                        <Select value={bpBeziehung} onValueChange={(v) => setBpBeziehung(v as Beziehung)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Bitte wählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BEZIEHUNG_OPTIONS.map((o) => (
                                                    <SelectItem key={o.value} value={o.value}>
                                                        {o.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <Field label="Sorgerecht *">
                                        <Select value={bpSorgerecht} onValueChange={(v) => setBpSorgerecht(v as Sorgerecht)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Bitte wählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SORGERECHT_OPTIONS.map((o) => (
                                                    <SelectItem key={o.value} value={o.value}>
                                                        {o.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <Field label="Gültig ab *" htmlFor="bp-validfrom">
                                        <Input
                                            id="bp-validfrom"
                                            type="date"
                                            value={bpValidFrom}
                                            onChange={(e) => setBpValidFrom(e.target.value)}
                                        />
                                    </Field>
                                </div>

                                <div className="rounded-2xl border p-4 space-y-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="text-sm font-semibold">Bezugsperson</div>
                                            <div className="text-xs text-muted-foreground">
                                                Bestehend auswählen oder neu erfassen
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant={useExistingBp ? "default" : "outline"}
                                                onClick={() => {
                                                    setUseExistingBp(true);
                                                    setSelectedBp(null);
                                                    setSelectedBpDetail(null);
                                                    setBpOpen(true);
                                                    runBpSearch(bpQuery, 0, true);
                                                }}
                                            >
                                                Bestehend
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={!useExistingBp ? "default" : "outline"}
                                                onClick={() => {
                                                    setUseExistingBp(false);
                                                    setSelectedBp(null);
                                                    setSelectedBpDetail(null);
                                                    setBpOpen(false);
                                                    setHaushaltDisabledReason(null);
                                                }}
                                            >
                                                Neu
                                            </Button>
                                        </div>
                                    </div>

                                    {useExistingBp ? (
                                        <div className="space-y-3">
                                            <Field label="Suche & Auswahl *">
                                                <div className="flex items-center gap-2">
                                                    <Popover open={bpOpen} onOpenChange={setBpOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className="flex-1 justify-between"
                                                                ref={refBpSearchBtn}
                                                            >
                                                                {selectedBp ? (
                                                                    <span className="truncate">
                                    {selectedBp.displayName}
                                                                        {selectedBp.geburtsdatum ? ` (${fmtDate(selectedBp.geburtsdatum)})` : ""}
                                  </span>
                                                                ) : (
                                                                    "Bezugsperson suchen…"
                                                                )}
                                                                <span className="ml-2 flex items-center gap-2">
                                  {bpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                                                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                </span>
                                                            </Button>
                                                        </PopoverTrigger>

                                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                            <Command shouldFilter={false}>
                                                                <CommandInput
                                                                    placeholder="Name eingeben…"
                                                                    value={bpQuery}
                                                                    onValueChange={(v) => {
                                                                        setBpQuery(v);
                                                                        scheduleBpSearch(v);
                                                                    }}
                                                                />
                                                                <CommandEmpty>
                                                                    {bpLoading ? "Suche…" : "Keine Bezugsperson gefunden."}
                                                                </CommandEmpty>

                                                                <CommandGroup>
                                                                    {bpItems.map((bp) => (
                                                                        <CommandItem
                                                                            key={bp.id}
                                                                            value={String(bp.id)}
                                                                            onSelect={() => {
                                                                                setSelectedBp(bp);
                                                                                setBpOpen(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={[
                                                                                    "mr-2 h-4 w-4",
                                                                                    selectedBp?.id === bp.id ? "opacity-100" : "opacity-0",
                                                                                ].join(" ")}
                                                                            />
                                                                            <div className="min-w-0">
                                                                                <div className="truncate">
                                                                                    {bp.displayName}
                                                                                    {bp.geburtsdatum ? ` (${fmtDate(bp.geburtsdatum)})` : ""}
                                                                                </div>
                                                                                {bp.telefon || bp.kontaktEmail ? (
                                                                                    <div className="truncate text-xs text-muted-foreground">
                                                                                        {[bp.telefon, bp.kontaktEmail].filter(Boolean).join(" · ")}
                                                                                    </div>
                                                                                ) : null}
                                                                            </div>
                                                                        </CommandItem>
                                                                    ))}

                                                                    {bpItems.length < bpTotal ? (
                                                                        <div className="p-2">
                                                                            <Button
                                                                                type="button"
                                                                                variant="secondary"
                                                                                className="w-full"
                                                                                disabled={bpLoading}
                                                                                onClick={() => runBpSearch(bpQuery, bpPage + 1, false)}
                                                                            >
                                                                                {bpLoading ? "Lade…" : "Mehr laden"}
                                                                            </Button>
                                                                        </div>
                                                                    ) : null}
                                                                </CommandGroup>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>

                                                    {selectedBp ? (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setSelectedBp(null);
                                                                setSelectedBpDetail(null);
                                                                setHaushaltDisabledReason(null);
                                                            }}
                                                            aria-label="Auswahl löschen"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </Field>

                                            {selectedBp ? (
                                                <div className="text-xs text-muted-foreground">
                                                    {haushaltDisabledReason ? (
                                                        <span>
                              Hinweis: <span className="text-destructive">„Im Haushalt“ ist deaktiviert</span>{" "}
                                                            ({haushaltDisabledReason}).
                            </span>
                                                    ) : (
                                                        <span>Adresse passt: „Im Haushalt“ kann gesetzt werden.</span>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <Field label="Vorname *" htmlFor="bp-vorname">
                                                    <Input
                                                        id="bp-vorname"
                                                        ref={refBpVorname}
                                                        value={bpVorname}
                                                        onChange={(e) => setBpVorname(e.target.value)}
                                                    />
                                                </Field>

                                                <Field label="Nachname *" htmlFor="bp-nachname">
                                                    <Input
                                                        id="bp-nachname"
                                                        value={bpNachname}
                                                        onChange={(e) => setBpNachname(e.target.value)}
                                                    />
                                                </Field>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <Field label="Geburtsdatum *" htmlFor="bp-geb">
                                                    <Input
                                                        id="bp-geb"
                                                        type="date"
                                                        value={bpGeb}
                                                        onChange={(e) => setBpGeb(e.target.value)}
                                                    />
                                                </Field>

                                                <Field label="Geschlecht *">
                                                    <Select value={bpGender} onValueChange={(v) => setBpGender(v as Gender)}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Bitte wählen" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {GENDER_OPTIONS.map((o) => (
                                                                <SelectItem key={o.value} value={o.value}>
                                                                    {o.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {bpGender === "UNBEKANNT" ? (
                                                        <div className="mt-1 text-[11px] text-destructive">
                                                            Bitte Geschlecht auswählen (nicht „Unbekannt“).
                                                        </div>
                                                    ) : null}
                                                </Field>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <Field label="Telefon" htmlFor="bp-telefon">
                                                    <Input
                                                        id="bp-telefon"
                                                        value={bpTelefon}
                                                        onChange={(e) => setBpTelefon(e.target.value)}
                                                    />
                                                </Field>

                                                <Field label="E-Mail (optional)" htmlFor="bp-email">
                                                    <Input id="bp-email" value={bpEmail} onChange={(e) => setBpEmail(e.target.value)} />
                                                </Field>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="text-xs font-semibold text-muted-foreground">Adresse</div>

                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    <Field label="Straße" htmlFor="bp-str">
                                                        <Input
                                                            id="bp-str"
                                                            value={bpStr}
                                                            onChange={(e) => setBpStr(e.target.value)}
                                                            disabled={bpAddressLockedNew}
                                                            className={bpAddressLockedNew ? "opacity-80" : ""}
                                                        />
                                                    </Field>

                                                    <Field label="Hausnr." htmlFor="bp-hnr">
                                                        <Input
                                                            id="bp-hnr"
                                                            value={bpHnr}
                                                            onChange={(e) => setBpHnr(e.target.value)}
                                                            disabled={bpAddressLockedNew}
                                                            className={bpAddressLockedNew ? "opacity-80" : ""}
                                                        />
                                                    </Field>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    <Field label="PLZ" htmlFor="bp-plz">
                                                        <Input
                                                            id="bp-plz"
                                                            value={bpPlz}
                                                            onChange={(e) => setBpPlz(e.target.value)}
                                                            disabled={bpAddressLockedNew}
                                                            className={bpAddressLockedNew ? "opacity-80" : ""}
                                                        />
                                                    </Field>

                                                    <Field label="Ort" htmlFor="bp-ort">
                                                        <Input
                                                            id="bp-ort"
                                                            value={bpOrt}
                                                            onChange={(e) => setBpOrt(e.target.value)}
                                                            disabled={bpAddressLockedNew}
                                                            className={bpAddressLockedNew ? "opacity-80" : ""}
                                                        />
                                                    </Field>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Flags */}
                                <div className="flex flex-wrap gap-6 pt-1">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="bp-haupt"
                                            checked={bpHaupt}
                                            onCheckedChange={(v) => setBpHaupt(Boolean(v))}
                                        />
                                        <Label htmlFor="bp-haupt" className="text-sm">
                                            Hauptkontakt
                                        </Label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="bp-haushalt"
                                            checked={bpHaushalt}
                                            disabled={haushaltDisabled}
                                            onCheckedChange={(v) => {
                                                const next = Boolean(v);
                                                if (haushaltDisabled && next) return;
                                                setBpHaushalt(next);
                                            }}
                                        />
                                        <Label htmlFor="bp-haushalt" className="text-sm">
                                            Im Haushalt
                                        </Label>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-2">
                                    <Button variant="secondary" onClick={() => setStep(2)} disabled={loading}>
                                        Zurück
                                    </Button>
                                    <Button onClick={openConfirm} disabled={!canNext3 || loading}>
                                        {loading ? "Speichere…" : "Kind anlegen"}
                                    </Button>
                                </div>

                                {/* Confirm Modal (redesigned: readable addresses, less "boxed", cleaner scroll) */}
                                <Dialog open={confirmOpen} onOpenChange={(v) => (loading ? null : setConfirmOpen(v))}>
                                    <DialogContent
                                        className={[
                                            "p-0",
                                            "w-[calc(100vw-1.5rem)] sm:w-auto",
                                            "sm:max-w-4xl",
                                            "max-h-[90vh]",
                                            "overflow-hidden",
                                        ].join(" ")}
                                    >
                                        {/* Header */}
                                        <div className="px-6 pt-6">
                                            <DialogHeader>
                                                <DialogTitle>Angaben prüfen</DialogTitle>
                                                <DialogDescription>
                                                    Bitte kontrollieren – erst nach Bestätigung wird gespeichert.
                                                </DialogDescription>
                                            </DialogHeader>
                                        </div>

                                        {/* Body (single scroll area; cards stay readable) */}
                                        <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-168px)]">
                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                                <ConfirmCard title="Kind">
                                                    <ConfirmRow label="Name">{kindName}</ConfirmRow>
                                                    <ConfirmRow label="Geburtsdatum">{fmtDate(kGeb || null)}</ConfirmRow>
                                                    <ConfirmRow label="Geschlecht">{kGender}</ConfirmRow>

                                                    <ConfirmRow label="Adresse">
                                                        <div className="rounded-xl border bg-muted/20 px-3 py-2">
                                                            <div>{kindAddrLines.l1}</div>
                                                            <div className="text-muted-foreground">{kindAddrLines.l2}</div>
                                                        </div>
                                                    </ConfirmRow>

                                                    <ConfirmRow label="Förderbedarf">
                                                        <Badge variant={foerderbedarf ? "secondary" : "outline"}>
                                                            {foerderbedarf ? "Ja" : "Nein"}
                                                        </Badge>
                                                        {foerderbedarf && foerderbedarfDetails.trim() ? (
                                                            <div className="mt-2 rounded-xl border bg-muted/20 px-3 py-2 text-sm font-normal">
                                                                {foerderbedarfDetails}
                                                            </div>
                                                        ) : null}
                                                    </ConfirmRow>

                                                    <ConfirmRow label="Hinweise">
                                                        {gesundheit.trim() ? (
                                                            <div className="rounded-xl border bg-muted/20 px-3 py-2 text-sm font-normal">
                                                                {gesundheit}
                                                            </div>
                                                        ) : (
                                                            "—"
                                                        )}
                                                    </ConfirmRow>
                                                </ConfirmCard>

                                                <ConfirmCard
                                                    title="Bezugsperson"
                                                    badge={
                                                        <Badge variant={bpMode === "BESTEHEND" ? "secondary" : "outline"}>
                                                            {bpMode === "BESTEHEND" ? "Bestehend" : "Neu"}
                                                        </Badge>
                                                    }
                                                >
                                                    <ConfirmRow label="Beziehung">{bpBeziehung}</ConfirmRow>
                                                    <ConfirmRow label="Sorgerecht">{bpSorgerecht}</ConfirmRow>
                                                    <ConfirmRow label="Gültig ab">{fmtDate(bpValidFrom)}</ConfirmRow>
                                                    <ConfirmRow label="Hauptkontakt">{fmtYesNo(bpHaupt)}</ConfirmRow>

                                                    <ConfirmRow label="Im Haushalt">
                                                        <div className="inline-flex items-center gap-2">
                                                            <Badge variant={bpHaushalt ? "secondary" : "outline"}>
                                                                {fmtYesNo(bpHaushalt)}
                                                            </Badge>
                                                            {haushaltDisabledReason ? (
                                                                <span className="text-xs text-muted-foreground">
                                  ({haushaltDisabledReason})
                                </span>
                                                            ) : null}
                                                        </div>
                                                    </ConfirmRow>

                                                    <Separator className="my-3" />

                                                    <ConfirmRow label="Name">{bpName}</ConfirmRow>
                                                    <ConfirmRow label="Geburtsdatum">{bpGebShow}</ConfirmRow>
                                                    <ConfirmRow label="Telefon">{bpPhoneShow}</ConfirmRow>
                                                    <ConfirmRow label="E-Mail">{bpMailShow}</ConfirmRow>

                                                    <ConfirmRow label="Adresse">
                                                        <div className="rounded-xl border bg-muted/20 px-3 py-2">
                                                            <div>{bpAddrLines.l1}</div>
                                                            <div className="text-muted-foreground">{bpAddrLines.l2}</div>
                                                        </div>
                                                    </ConfirmRow>
                                                </ConfirmCard>
                                            </div>

                                            <div className="mt-4 text-xs text-muted-foreground">
                                                Tipp: Wenn du auf einem kleinen Display bist, kannst du hier im Modal scrollen – Footer bleibt fix.
                                            </div>
                                        </div>

                                        {/* Sticky footer */}
                                        <div className="px-6 pb-6 pt-4 border-t bg-background">
                                            <DialogFooter className="gap-2 sm:gap-2">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={() => setConfirmOpen(false)}
                                                    disabled={loading}
                                                >
                                                    Zurück
                                                </Button>
                                                <Button type="button" onClick={submit} disabled={loading}>
                                                    {loading ? "Speichere…" : "Bestätigen & speichern"}
                                                </Button>
                                            </DialogFooter>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
            </div>
        </AuthGate>
    );
}