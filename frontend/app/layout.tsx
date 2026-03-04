import "./globals.css";
import type { Metadata } from "next";
import {AuthProvider} from "@/lib/useAuth";
import {Toaster} from "sonner";

export const metadata: Metadata = {
  title: "KIDOC – Digitales Kinderschutz-Dossier",
  description: "Digitale Fachverfahren für §8a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen antialiased">
      <AuthProvider>{children}
      <Toaster
          position="top-center"
          duration={500}
          richColors={true}
          closeButton={true}
      />
      </AuthProvider>
      </body>
    </html>
  );
}
