
import type { Dispatch, SetStateAction } from "react";

import type { MeldungDraftRequest } from "@/lib/api/meldung";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import { DATENB, DATENB_LABEL, DRING, DRING_LABEL, MELDEWEG, MELDEWEG_LABEL } from "./meldungEditor.constants";
import { changeTooltip, changedInputClass, changedLabelClass, pick } from "./meldungEditor.helpers";
import type { MelderInfo } from "./meldungEditor.types";
import { FieldRow, SectionCard } from "./MeldungEditor.ui";

type MeldungBasisSectionProps = {
  form: MeldungDraftRequest;
  melderInfo: MelderInfo;
  disabled: boolean;
  statusIsDone: boolean;
  setField: <K extends keyof MeldungDraftRequest>(key: K, value: MeldungDraftRequest[K]) => void;
  setMelderInfo: Dispatch<SetStateAction<MelderInfo>>;
  isChanged: (path: string) => boolean;
  previousValueOf: (path: string) => unknown;
};

type BelastungKey =
  | "belastungKoerperlErkrankung"
  | "belastungPsychErkrankung"
  | "belastungSucht"
  | "belastungHaeuslicheGewalt"
  | "belastungSuizidgefahr"
  | "belastungGewalttaetigeErz"
  | "belastungSozialeIsolation";

const BELASTUNGSFAKTOREN: Array<{ key: BelastungKey; label: string }> = [
  { key: "belastungKoerperlErkrankung", label: "Körperliche Erkrankung" },
  { key: "belastungPsychErkrankung", label: "Psychische Erkrankung" },
  { key: "belastungSucht", label: "Sucht" },
  { key: "belastungHaeuslicheGewalt", label: "Häusliche Gewalt" },
  { key: "belastungSuizidgefahr", label: "Suizidgefahr" },
  { key: "belastungGewalttaetigeErz", label: "Gewalttätige Erziehung" },
  { key: "belastungSozialeIsolation", label: "Soziale Isolation" },
];

export function MeldungBasisSection({
  form,
  melderInfo,
  disabled,
  statusIsDone,
  setField,
  setMelderInfo,
  isChanged,
  previousValueOf,
}: MeldungBasisSectionProps) {
  return (
    <SectionCard title="Basis & Melder-Informationen" description="Einstieg in die Meldung, Datenbasis und Angaben der meldenden Person.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(() => {
          const changed = isChanged("erfasstVonRolle");
          const prev = previousValueOf("erfasstVonRolle");
          return (
            <FieldRow label="Erfasst von (Rolle)" changed={changed} previousValue={prev} labelClassName={changedLabelClass(changed)}>
              <Input
                value={String(form.erfasstVonRolle ?? "")}
                onChange={(e) => setField("erfasstVonRolle", e.target.value)}
                disabled={disabled || statusIsDone}
                className={changedInputClass(changed)}
                title={changeTooltip(changed, prev)}
              />
            </FieldRow>
          );
        })()}

        {(() => {
          const changed = isChanged("meldeweg");
          const prev = previousValueOf("meldeweg");
          return (
            <FieldRow label="Meldeweg" changed={changed} previousValue={prev} labelClassName={changedLabelClass(changed)}>
              <select
                className={`h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text ${changedInputClass(changed)}`}
                value={pick(String(form.meldeweg ?? "TELEFON"), MELDEWEG, "TELEFON")}
                onChange={(e) => setField("meldeweg", e.target.value)}
                disabled={disabled || statusIsDone}
                title={changeTooltip(changed, prev)}
              >
                {MELDEWEG.map((x) => <option key={x} value={x}>{MELDEWEG_LABEL[x]}</option>)}
              </select>
            </FieldRow>
          );
        })()}

        {String(form.meldeweg) === "SONSTIGES" ? (
          <FieldRow label="Meldeweg sonstiges">
            <Input
              value={String(form.meldewegSonstiges ?? "")}
              onChange={(e) => setField("meldewegSonstiges", e.target.value || null)}
              disabled={disabled || statusIsDone}
            />
          </FieldRow>
        ) : null}

        {(() => {
          const changed = isChanged("meldendeStelleKontakt");
          const prev = previousValueOf("meldendeStelleKontakt");
          return (
            <FieldRow
              label="Meldende Stelle (Kontakt)"
              hint="z.B. Name/Institution, Rückrufnummer, E-Mail"
              changed={changed}
              previousValue={prev}
              labelClassName={changedLabelClass(changed)}
            >
              <Input
                value={String(form.meldendeStelleKontakt ?? "")}
                onChange={(e) => setField("meldendeStelleKontakt", e.target.value)}
                disabled={disabled || statusIsDone}
                className={changedInputClass(changed)}
                title={changeTooltip(changed, prev)}
              />
            </FieldRow>
          );
        })()}

        <FieldRow label="Datenbasis">
          <select
            className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
            value={pick(String(form.datenbasis ?? "UNKLAR"), DATENB, "UNKLAR")}
            onChange={(e) => setField("datenbasis", e.target.value)}
            disabled={disabled || statusIsDone}
          >
            {DATENB.map((x) => <option key={x} value={x}>{DATENB_LABEL[x]}</option>)}
          </select>
        </FieldRow>

        <FieldRow label="Dringlichkeit">
          <select
            className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
            value={pick(String(form.dringlichkeit ?? "UNKLAR"), DRING, "UNKLAR")}
            onChange={(e) => setField("dringlichkeit", e.target.value)}
            disabled={disabled || statusIsDone}
          >
            {DRING.map((x) => <option key={x} value={x}>{DRING_LABEL[x]}</option>)}
          </select>
        </FieldRow>

        <FieldRow label="Einwilligung vorhanden">
          <select
            className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
            value={String(form.einwilligungVorhanden ?? "")}
            onChange={(e) => setField("einwilligungVorhanden", e.target.value === "" ? null : e.target.value === "true")}
            disabled={disabled || statusIsDone}
          >
            <option value="">—</option>
            <option value="true">Ja</option>
            <option value="false">Nein</option>
          </select>
        </FieldRow>

        <FieldRow label="Schweigepflichtentbindung vorhanden">
          <select
            className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
            value={String(form.schweigepflichtentbindungVorhanden ?? "")}
            onChange={(e) => setField("schweigepflichtentbindungVorhanden", e.target.value === "" ? null : e.target.value === "true")}
            disabled={disabled || statusIsDone}
          >
            <option value="">—</option>
            <option value="true">Ja</option>
            <option value="false">Nein</option>
          </select>
        </FieldRow>

        {(() => {
          const changed = isChanged("kurzbeschreibung");
          const prev = previousValueOf("kurzbeschreibung");
          return (
            <FieldRow
              label="Kurzbeschreibung (Sachlage)"
              hint="Kurz, sachlich, überprüfbar. Keine Wertungen."
              changed={changed}
              previousValue={prev}
              labelClassName={changedLabelClass(changed)}
            >
              <Textarea
                rows={5}
                value={String(form.kurzbeschreibung ?? "")}
                onChange={(e) => setField("kurzbeschreibung", e.target.value)}
                disabled={disabled || statusIsDone}
                className={changedInputClass(changed)}
                title={changeTooltip(changed, prev)}
              />
            </FieldRow>
          );
        })()}
      </div>

      <Separator className="my-3" />

      <div className="text-sm font-semibold text-brand-text">Melder-Informationen</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FieldRow label="Name der meldenden Person">
          <Input value={melderInfo.melderName} onChange={(e) => setMelderInfo((p) => ({ ...p, melderName: e.target.value }))} disabled={disabled || statusIsDone} />
        </FieldRow>
        <FieldRow label="Kontakt (Telefon / E-Mail)">
          <Input value={melderInfo.melderKontakt} onChange={(e) => setMelderInfo((p) => ({ ...p, melderKontakt: e.target.value }))} disabled={disabled || statusIsDone} />
        </FieldRow>
        <FieldRow label="Beziehung zum Kind">
          <Input value={melderInfo.melderBeziehungKind} onChange={(e) => setMelderInfo((p) => ({ ...p, melderBeziehungKind: e.target.value }))} disabled={disabled || statusIsDone} />
        </FieldRow>
        <FieldRow label="Glaubwürdigkeit">
          <select
            className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
            value={melderInfo.melderGlaubwuerdigkeit ?? ""}
            onChange={(e) => setMelderInfo((p) => ({ ...p, melderGlaubwuerdigkeit: e.target.value || null }))}
            disabled={disabled || statusIsDone}
          >
            <option value="">—</option>
            <option value="GUT">Gut</option>
            <option value="MITTEL">Mittel</option>
            <option value="GERING">Gering</option>
          </select>
        </FieldRow>
        <FieldRow label="Aktueller Aufenthaltsort Kind">
          <Input
            value={melderInfo.kindAktuellerAufenthalt}
            onChange={(e) => setMelderInfo((p) => ({ ...p, kindAktuellerAufenthalt: e.target.value }))}
            disabled={disabled || statusIsDone}
          />
        </FieldRow>
      </div>

      <Separator className="my-3" />

      <div className="text-sm font-semibold text-brand-text">Belastungsfaktoren</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {BELASTUNGSFAKTOREN.map(({ key, label }) => (
          <div key={key} className={`rounded-2xl border p-3 flex items-center justify-between ${melderInfo[key] ? "border-amber-300 bg-amber-50" : "border-brand-border/25 bg-white"}`}>
            <span className={`text-sm ${melderInfo[key] ? "font-semibold text-amber-800" : "text-brand-text"}`}>{label}</span>
            <Switch checked={melderInfo[key]} onCheckedChange={(value) => setMelderInfo((p) => ({ ...p, [key]: value }))} disabled={disabled || statusIsDone} />
          </div>
        ))}
      </div>
      <FieldRow label="Sonstige Belastungen">
        <Textarea
          rows={2}
          value={melderInfo.belastungSonstiges}
          onChange={(e) => setMelderInfo((p) => ({ ...p, belastungSonstiges: e.target.value }))}
          disabled={disabled || statusIsDone}
        />
      </FieldRow>
    </SectionCard>
  );
}

