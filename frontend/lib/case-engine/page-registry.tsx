
'use client';

import type { ComponentType } from 'react';
import { resolveCaseModule, type CaseModuleId } from '@/lib/case-engine/modules';

import FallMeldungPage from '@/components/case-pages/falloeffnungen/MeldungPage';
import FallKinderschutzbogenPage from '@/components/case-pages/falloeffnungen/KinderschutzbogenPage';
import FallMeldeboegenPage from '@/components/case-pages/falloeffnungen/MeldeboegenPage';
import FallDjiPage from '@/components/case-pages/falloeffnungen/DjiPage';
import FallSchutzplaenePage from '@/components/case-pages/falloeffnungen/SchutzplaenePage';
import FallHausbesuchePage from '@/components/case-pages/falloeffnungen/HausbesuchePage';

import AktenMeldungPage from '@/components/case-pages/akten/MeldungPage';
import AktenKinderschutzbogenPage from '@/components/case-pages/akten/KinderschutzbogenPage';
import AktenMeldeboegenPage from '@/components/case-pages/akten/MeldeboegenPage';
import AktenDjiPage from '@/components/case-pages/akten/DjiPage';
import AktenSchutzplaenePage from '@/components/case-pages/akten/SchutzplaenePage';
import AktenHausbesuchePage from '@/components/case-pages/akten/HausbesuchePage';

type CasePageComponent = ComponentType;

const FALL_PAGES: Record<Exclude<CaseModuleId, 'export'>, CasePageComponent> = {
  meldung: FallMeldungPage,
  kinderschutzbogen: FallKinderschutzbogenPage,
  meldeboegen: FallMeldeboegenPage,
  dji: FallDjiPage,
  schutzplaene: FallSchutzplaenePage,
  hausbesuche: FallHausbesuchePage,
};

const AKTEN_PAGES: Record<Exclude<CaseModuleId, 'export'>, CasePageComponent> = {
  meldung: AktenMeldungPage,
  kinderschutzbogen: AktenKinderschutzbogenPage,
  meldeboegen: AktenMeldeboegenPage,
  dji: AktenDjiPage,
  schutzplaene: AktenSchutzplaenePage,
  hausbesuche: AktenHausbesuchePage,
};

export function getCasePageComponent(step: string, inAkteContext = false) {
  const resolved = resolveCaseModule(step);
  if (!resolved || resolved.id === 'export') return null;
  const registry = inAkteContext ? AKTEN_PAGES : FALL_PAGES;
  return registry[resolved.id as Exclude<CaseModuleId, 'export'>] ?? null;
}
