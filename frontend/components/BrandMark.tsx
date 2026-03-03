import Image from "next/image";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">

      {compact ? null : (
        <div className="-space-y-0.5">
          <div className="text-lg font-extrabold tracking-tight text-brand-navy">KIDOC</div>
          <div className="text-xs font-medium text-brand-text2">
            Digitales Kinderschutz-Dossier · §8a
          </div>
        </div>
      )}
    </div>
  );
}
