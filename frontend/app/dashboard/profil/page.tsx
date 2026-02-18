"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type Profile = {
    vorname: string | null;
    nachname: string | null;
    email: string | null;
    telefon: string | null;
};

const emptyProfile: Profile = {
    vorname: "",
    nachname: "",
    email: "",
    telefon: "",
};

async function logout() {
    try {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
        window.location.href = "/";
    }
}

export default function ProfilPage() {
    const router = useRouter();

    const [profile, setProfile] = useState<Profile>(emptyProfile);
    const [initial, setInitial] = useState<Profile>(emptyProfile);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [savedDialogOpen, setSavedDialogOpen] = useState(false);

    // Profil laden
    useEffect(() => {
        const load = async () => {
            try {
                setError(null);

                const res = await fetch("/api/auth/profile", {
                    credentials: "include",
                    cache: "no-store",
                });

                if (!res.ok) {
                    let msg = `HTTP ${res.status}`;
                    try {
                        const t = await res.text();
                        if (t) msg = t;
                    } catch {}
                    throw new Error(msg);
                }

                const data = (await res.json()) as Profile;

                const normalized: Profile = {
                    vorname: data?.vorname ?? "",
                    nachname: data?.nachname ?? "",
                    email: data?.email ?? "",
                    telefon: data?.telefon ?? "",
                };

                setProfile(normalized);
                setInitial(normalized);
            } catch (e) {
                console.error("Profil Ladefehler:", e);
                setError("Profil konnte nicht geladen werden.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const isDirty = useMemo(
        () => JSON.stringify(profile) !== JSON.stringify(initial),
        [profile, initial]
    );

    const handleChange = (field: keyof Profile, value: string) => {
        setProfile((p) => ({ ...p, [field]: value }));
    };

    const cancel = () => {
        if (isDirty && !confirm("Änderungen verwerfen?")) return;
        router.push("/dashboard");
    };

    const saveAndLogout = async () => {
        try {
            setSaving(true);
            setError(null);

            const payload = {
                vorname: profile.vorname ?? "",
                nachname: profile.nachname ?? "",
                telefon: profile.telefon ?? "",
            };

            const res = await fetch("/api/auth/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try {
                    const t = await res.text();
                    if (t) msg = t;
                } catch {}
                throw new Error(msg);
            }

            setInitial(profile);
            setSavedDialogOpen(true); // ✅ Info Dialog anzeigen
        } catch (e) {
            console.error("Speicherfehler:", e);
            setError("Profil konnte nicht gespeichert werden.");
        } finally {
            setSaving(false);
        }
    };

    const confirmLogout = async () => {
        setSavedDialogOpen(false);
        await logout();
    };

    if (loading) return <div className="p-6">Lade Profil…</div>;

    return (
        <div className="max-w-xl mx-auto p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Mein Profil</h1>
                {isDirty && (
                    <span className="text-xs text-muted-foreground">
            Ungespeicherte Änderungen
          </span>
                )}
            </div>

            {error && <div className="text-sm text-red-500">{error}</div>}

            <div className="space-y-3">
                <Input
                    value={profile.vorname ?? ""}
                    onChange={(e) => handleChange("vorname", e.target.value)}
                    placeholder="Vorname"
                />

                <Input
                    value={profile.nachname ?? ""}
                    onChange={(e) => handleChange("nachname", e.target.value)}
                    placeholder="Nachname"
                />

                <Input value={profile.email ?? ""} placeholder="E-Mail" disabled />

                <Input
                    value={profile.telefon ?? ""}
                    onChange={(e) => handleChange("telefon", e.target.value)}
                    placeholder="Telefon"
                />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
                <Button variant="outline" onClick={cancel} disabled={saving}>
                    Abbrechen
                </Button>

                <Button onClick={saveAndLogout} disabled={saving || !isDirty}>
                    {saving ? "Speichern…" : "Speichern & Logout"}
                </Button>
            </div>

            {/* ✅ shadcn Dialog */}
            <Dialog open={savedDialogOpen} onOpenChange={setSavedDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Änderungen gespeichert</DialogTitle>
                        <DialogDescription>
                            Deine Stammdaten wurden gespeichert. Bitte melde dich aus
                            Sicherheitsgründen erneut an.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setSavedDialogOpen(false)}>
                            Später
                        </Button>
                        <Button onClick={confirmLogout}>OK · Logout</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}