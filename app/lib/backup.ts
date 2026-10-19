import { normalizeAcademyProgress } from "./academy";
import { normalizeCharacterLibrary } from "./character-library";
import type { CharacterLibraryEntry } from "./character-library";
import type { Locale } from "./i18n";
import { normalizeGameState } from "./session";
import type { GameState } from "./session";

export const SESSION_STORAGE_KEY = "shinobigami-console-v1";
export const BACKUP_FORMAT = "shinobigami-device-backup";
export const MAX_BACKUP_BYTES = 32 * 1024 * 1024;

export type BackupData = {
  game: GameState;
  characterLibrary: CharacterLibraryEntry[];
  academyDone: string[];
  locale: Locale;
};

export function parseSession(value: unknown): GameState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const version = (value as Record<string, unknown>).schemaVersion;
  if (version !== undefined && (typeof version !== "number" || version > 9)) return null;
  return normalizeGameState(value);
}

export function parseLibrary(value: unknown): CharacterLibraryEntry[] | null {
  if (!Array.isArray(value)) return null;
  const entries = normalizeCharacterLibrary(value);
  // Do not quietly replace a partly damaged library with a truncated one.
  if (entries.length !== value.length) return null;
  return entries.map((entry) => {
    const game = normalizeGameState({ characters: [entry.character] });
    return normalizeCharacterLibrary([{ ...entry, character: game!.characters[0] }])[0];
  });
}

export function parseAcademy(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? normalizeAcademyProgress(value) : null;
}

export function parseLocale(value: unknown): Locale | null {
  return value === "zh" || value === "en" || value === "ja" ? value : null;
}

export function createDeviceBackup(data: BackupData, exportedAt = new Date().toISOString()) {
  return { format: BACKUP_FORMAT, backupVersion: 1, exportedAt, ...data };
}

export type ImportedBackup = { kind: "session"; game: GameState } | ({ kind: "device" } & BackupData);

/** Supports old session-only files without touching their separate device data. */
export function parseBackup(value: unknown): ImportedBackup | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if ("format" in raw || "backupVersion" in raw) {
    if (raw.format !== BACKUP_FORMAT || raw.backupVersion !== 1) return null;
    const game = parseSession(raw.game);
    const characterLibrary = parseLibrary(raw.characterLibrary);
    const academyDone = parseAcademy(raw.academyDone);
    const locale = parseLocale(raw.locale);
    if (!game || !characterLibrary || !academyDone || !locale) return null;
    return { kind: "device", game, characterLibrary, academyDone, locale };
  }
  const game = parseSession(raw);
  return game ? { kind: "session", game } : null;
}
