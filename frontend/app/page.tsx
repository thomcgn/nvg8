"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || "Login fehlgeschlagen");
      }

      const data = await res.json();
      const token = data.token;

      // JWT im localStorage speichern (für MVP; später httpOnly Cookie empfohlen)
      localStorage.setItem("jwt", token);

      // Weiterleitung zum Dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
        {/* HEADER */}
        <header className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
            Navig8tor – Fallkompass
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Fachportal zum Schutzauftrag gemäß § 8a SGB VIII
          </p>
        </header>

        {/* CONTAINER */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl bg-white">
          {/* HERO */}
          <section className="relative min-h-105">
            <Image
                src="/hero2.jpg"
                alt="Schutzauftrag bei Kindeswohlgefährdung"
                fill
                priority
                className="object-cover"
            />
            <div className="absolute inset-0 bg-black/45" />
            <div className="absolute inset-0 z-10 flex flex-col justify-center px-10 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Schutzauftrag bei Kindeswohlgefährdung
              </h2>
              <p className="text-lg max-w-md leading-relaxed">
                Der Fallkompass unterstützt autorisierte Fachkräfte bei der
                fachlichen Einschätzung und Dokumentation gemäß § 8a SGB VIII –
                strukturiert, datenschutzkonform und nachvollziehbar.
              </p>
            </div>
          </section>

          {/* LOGIN */}
          <section className="flex items-center justify-center p-8">
            <div className="w-full max-w-sm">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Anmeldung für Fachkräfte
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                Der Zugriff ist ausschließlich autorisierten Personen vorbehalten.
              </p>

              <form className="space-y-4" onSubmit={handleLogin}>
                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Dienstliche E-Mail-Adresse
                  </label>
                  <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vorname.nachname@traeger.de"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2
               placeholder-gray-700 text-black
               focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Passwort
                  </label>
                  <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2
               placeholder-gray-700 text-black
               focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? "Anmelden..." : "Anmelden"}
                </button>
              </form>

              <p className="text-xs text-gray-500 mt-6 leading-relaxed">
                Alle Angaben werden vertraulich behandelt. Die Verarbeitung
                personenbezogener Daten erfolgt gemäß DSGVO sowie den geltenden
                fachrechtlichen Vorgaben der Kinder- und Jugendhilfe.
              </p>
            </div>
          </section>
        </div>
      </main>
  );
}
