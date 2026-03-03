import "./globals.css";
import type { Metadata } from "next";
import {AuthProvider} from "@/lib/useAuth";

export const metadata: Metadata = {
  title: "KIDOC – Digitales Kinderschutz-Dossier",
  description: "Digitale Fachverfahren für §8a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen antialiased">
      <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
