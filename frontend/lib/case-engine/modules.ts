import {
  FileSearch,
  FileText,
  Shield,
  ClipboardList,
  ShieldCheck,
  Home,
  FileOutput,
  type LucideIcon,
} from 'lucide-react';

export type CaseModuleId =
  | 'meldung'
  | 'meldeboegen'
  | 'kinderschutzbogen'
  | 'dji'
  | 'schutzplaene'
  | 'hausbesuche'
  | 'export';

export type CaseModuleDef = {
  id: CaseModuleId;
  title: string;
  description: string;
  cta: string;
  icon: LucideIcon;
  aliases?: string[];
};

export const CASE_MODULES: CaseModuleDef[] = [
  {
    id: 'meldung',
    title: 'Meldung',
    description: 'Erstmeldung öffnen, Entwürfe weiterführen und abgeschlossene Meldungen prüfen.',
    cta: 'Meldung öffnen',
    icon: FileText,
    aliases: ['meldungen'],
  },
  {
    id: 'kinderschutzbogen',
    title: 'Kinderschutzbogen',
    description: 'Stuttgarter Kinderschutzbogen – Gefährdungseinschätzung.',
    cta: 'Assessments',
    icon: Shield,
    aliases: ['einschaetzung', 'assessment', 'assessments'],
  },
  {
    id: 'dji',
    title: 'DJI-Prüfbögen',
    description: 'Kindler et al. – Sicherheit, Risiko, Erziehungsfähigkeit und Bedürfnisse.',
    cta: 'Prüfbögen',
    icon: ClipboardList,
  },
  {
    id: 'meldeboegen',
    title: 'Eingangserfassung',
    description: 'Strukturierter Meldebogen – Ersteinschätzung und Triage.',
    cta: 'Meldebogen',
    icon: FileSearch,
    aliases: ['meldebogen'],
  },
  {
    id: 'schutzplaene',
    title: 'Schutzplanung',
    description: 'Schutzpläne mit Maßnahmen, Zuständigkeiten und Überprüfungsterminen.',
    cta: 'Schutzpläne',
    icon: ShieldCheck,
    aliases: ['schutzplan'],
  },
  {
    id: 'hausbesuche',
    title: 'Hausbesuche',
    description: 'Strukturierte Protokolle mit Wohnsituation, Kind- und Elternbeobachtungen.',
    cta: 'Protokolle',
    icon: Home,
    aliases: ['hausbesuch'],
  },
  {
    id: 'export',
    title: 'Fallakte als PDF',
    description: 'Komplette Fallzusammenfassung als druckfreundliche Ansicht für PDF-Export.',
    cta: 'PDF-Export',
    icon: FileOutput,
    aliases: ['pdf', 'report'],
  },
];

export function resolveCaseModule(step: string): CaseModuleDef | null {
  const normalized = step.trim().toLowerCase();
  return (
    CASE_MODULES.find((module) => module.id === normalized || module.aliases?.includes(normalized)) ?? null
  );
}
