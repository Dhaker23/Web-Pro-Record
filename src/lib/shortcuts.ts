// Keyboard shortcut definitions + persistence.

export type ShortcutAction =
  | "startStop"
  | "pauseResume"
  | "reset"
  | "toggleLang"
  | "toggleTheme"
  | "toggleWebcam"
  | "toggleMic"
  | "toggleAnnotations"
  | "toggleScheduler"
  | "captureSnapshot"
  | "captureClip";

export type ShortcutBinding = {
  /** The key combination, e.g. "Space", "KeyP", "Ctrl+KeyL". */
  combo: string;
  /** Whether this shortcut requires Ctrl/Cmd. */
  mod: boolean;
};

export type ShortcutMap = Record<ShortcutAction, ShortcutBinding>;

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  startStop: { combo: "Space", mod: false },
  pauseResume: { combo: "KeyP", mod: false },
  reset: { combo: "KeyR", mod: false },
  toggleLang: { combo: "KeyL", mod: true },
  toggleTheme: { combo: "KeyD", mod: true },
  toggleWebcam: { combo: "KeyW", mod: false },
  toggleMic: { combo: "KeyM", mod: false },
  toggleAnnotations: { combo: "KeyA", mod: false },
  toggleScheduler: { combo: "KeyS", mod: false },
  captureSnapshot: { combo: "KeyC", mod: false },
  captureClip: { combo: "KeyV", mod: false },
};

const SHORTCUT_KEY = "wpr-shortcuts-v1";

export function loadShortcuts(): ShortcutMap {
  if (typeof window === "undefined") return DEFAULT_SHORTCUTS;
  try {
    const raw = window.localStorage.getItem(SHORTCUT_KEY);
    if (!raw) return DEFAULT_SHORTCUTS;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return DEFAULT_SHORTCUTS;
    // SEC-009 FIX: Validate each shortcut entry before accepting it.
    const result: ShortcutMap = { ...DEFAULT_SHORTCUTS };
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!(key in DEFAULT_SHORTCUTS)) continue; // unknown action — skip
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof (value as Record<string, unknown>).combo === "string" &&
        typeof (value as Record<string, unknown>).mod === "boolean"
      ) {
        const v = value as { combo: string; mod: boolean };
        // Cap combo length to prevent abuse.
        if (v.combo.length > 20) continue;
        (result as Record<string, ShortcutBinding>)[key] = { combo: v.combo, mod: v.mod };
      }
    }
    return result;
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

export function saveShortcuts(map: ShortcutMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SHORTCUT_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Convert a KeyboardEvent into a comparable combo string + mod flag. */
export function eventToBinding(e: KeyboardEvent): ShortcutBinding {
  return {
    combo: e.code,
    mod: e.metaKey || e.ctrlKey,
  };
}

/** Human-readable label for a binding, e.g. "Ctrl + P" or "Space". */
export function bindingLabel(b: ShortcutBinding, isMac: boolean): string {
  const modLabel = isMac ? "⌘" : "Ctrl";
  const keyLabel = prettyKey(b.combo);
  return b.mod ? `${modLabel} + ${keyLabel}` : keyLabel;
}

/** Pretty-print a key code like "KeyP" → "P", "Space" → "Space". */
function prettyKey(combo: string): string {
  if (combo.startsWith("Key")) return combo.slice(3);
  if (combo.startsWith("Digit")) return combo.slice(5);
  return combo;
}
