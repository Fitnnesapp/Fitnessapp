import { create } from 'zustand';

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  /** Wird beim Abbrechen aufgerufen, z.B. um einen pausierten Timer weiterlaufen zu lassen */
  onCancel?: () => void;
};

type ConfirmState = {
  request: ConfirmOptions | null;
  open: (request: ConfirmOptions) => void;
  close: () => void;
};

/** Offene Rückfrage. Wird vom ConfirmHost im Root-Layout angezeigt (nicht gespeichert). */
export const useConfirmStore = create<ConfirmState>()((set) => ({
  request: null,
  open: (request) => set({ request }),
  close: () => set({ request: null }),
}));

/**
 * Bestätigungsdialog im App-Design auf allen Plattformen.
 * Bewusst kein window.confirm: In eingebetteten Ansichten (z.B. der Web-Vorschau) sind Browser-Dialoge
 * oft gesperrt und liefern still "Abbrechen", dann passierte bei Löschen, Verlassen usw. einfach nichts.
 */
export function confirmAction(options: ConfirmOptions): void {
  useConfirmStore.getState().open({ destructive: true, ...options });
}
