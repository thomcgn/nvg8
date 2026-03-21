import type { ReactNode } from "react";
import type { MeldungDraftRequest } from "@/lib/api/meldung";

export type WorkflowStepKey = "aufnahme" | "einschaetzung" | "massnahmen" | "planung" | "abschluss";

export type StepStatus = "open" | "done";

export type ObservationDraft = NonNullable<MeldungDraftRequest["observations"]>[number];
export type TagDraft = NonNullable<ObservationDraft["tags"]>[number];

export type MelderInfo = {
  melderName: string;
  melderKontakt: string;
  melderBeziehungKind: string;
  melderGlaubwuerdigkeit: string | null;
  kindAktuellerAufenthalt: string;
  belastungKoerperlErkrankung: boolean;
  belastungPsychErkrankung: boolean;
  belastungSucht: boolean;
  belastungHaeuslicheGewalt: boolean;
  belastungSuizidgefahr: boolean;
  belastungGewalttaetigeErz: boolean;
  belastungSozialeIsolation: boolean;
  belastungSonstiges: string;
};

/** Props passed to each companion bogen plugin's render function. */
export type CompanionBogenRenderProps<TState = unknown> = {
  state: TState;
  onChange: (next: TState) => void;
  disabled: boolean;
};

/**
 * Plugin interface for companion Bögen (forms) and Assessments.
 *
 * Each companion form (e.g. Kinderschutzbogen, DJI, Schutzplan, Hausbesuch)
 * implements this interface so it can be added to the editor without touching
 * the core MeldungEditor component.
 *
 * To add a new Bogen or Assessment:
 *  1. Create a plugin object that satisfies `CompanionBogenPlugin<YourState>`.
 *  2. Register it in the `COMPANION_BOGEN_PLUGINS` array in
 *     `meldungEditor.plugins.tsx`.
 *  3. Done – the MeldungEditor will automatically load, persist and render it.
 */
export interface CompanionBogenPlugin<TState = unknown> {
  /** Unique identifier (e.g. "kinderschutzbogen", "djiSicherheit"). */
  key: string;
  /** Human-readable label shown in the sidebar and persistence badge. */
  label: string;
  /** Which workflow step this companion form is displayed in. */
  step: WorkflowStepKey;
  /** Optional icon node shown in the PageCard header. */
  icon?: ReactNode;
  /** Factory that creates a fresh, empty initial state. */
  defaultState: () => TState;
  /**
   * Loads the initial state from the server (catalog + any existing record).
   * Should never throw – return `{ id: null, state: defaultState() }` on error.
   */
  loadInitial: (fallId: number) => Promise<{ id: number | null; state: TState }>;
  /**
   * Persists the current state to the server.
   * Pass `id = null` to create a new record; otherwise update the existing one.
   * Returns the server-assigned id of the saved record.
   */
  save: (fallId: number, id: number | null, state: TState) => Promise<number>;
  /** Renders the companion form content inside its PageCard. */
  render: (props: CompanionBogenRenderProps<TState>) => ReactNode;
  /**
   * Optional predicate: return `false` to skip persisting this plugin.
   * Use this for opt-in forms like Hausbesuch that the user must activate.
   */
  isEnabled?: (ctx: { mainForm: MeldungDraftRequest; state: TState }) => boolean;
}

