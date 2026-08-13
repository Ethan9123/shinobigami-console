import type { Character } from "./session";

export const CHARACTER_LIBRARY_STORAGE_KEY = "shinobigami-character-library-v1";
export const CHARACTER_LIBRARY_LIMIT = 24;

export type CharacterLibraryEntry = {
  schemaVersion: 1;
  id: string;
  name: string;
  faction: string;
  rank: string;
  savedAt: string;
  character: Character;
};

function entryId() {
  return `library-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function templateFingerprint(character: Pick<Character, "name" | "faction" | "rank">) {
  return [character.name, character.faction, character.rank].map((value) => value.trim().toLocaleLowerCase("zh-CN")).join("\u0000");
}

function resetCharacter(character: Character, id: string, role = character.role): Character {
  return {
    ...character,
    id,
    role,
    portrait: "",
    plot: null,
    active: true,
    extraLife: 0,
    life: Object.fromEntries(Object.keys(character.life).map((field) => [field, true])) as Character["life"],
    skills: [...character.skills],
    ninpoIds: [...character.ninpoIds],
    conditions: [],
    spentCost: 0,
    usedNinpoIds: [],
    backgroundItems: character.backgroundItems.map((item) => ({ ...item })),
    closedGaps: [...character.closedGaps],
    acted: false,
    tools: { ...character.tools },
  };
}

export function createCharacterLibraryEntry(character: Character, options: { id?: string; savedAt?: string } = {}): CharacterLibraryEntry {
  const savedAt = options.savedAt ?? new Date().toISOString();
  const id = options.id ?? entryId();
  const snapshot = resetCharacter(character, `template-${id}`);
  return {
    schemaVersion: 1,
    id,
    name: snapshot.name,
    faction: snapshot.faction,
    rank: snapshot.rank,
    savedAt,
    character: snapshot,
  };
}

export function upsertCharacterLibrary(entries: CharacterLibraryEntry[], character: Character, options: { id?: string; savedAt?: string } = {}) {
  const fingerprint = templateFingerprint(character);
  const existing = entries.find((entry) => templateFingerprint(entry.character) === fingerprint);
  const next = createCharacterLibraryEntry(character, { ...options, id: existing?.id ?? options.id });
  return [next, ...entries.filter((entry) => entry.id !== existing?.id)]
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, CHARACTER_LIBRARY_LIMIT);
}

export function materializeCharacter(entry: CharacterLibraryEntry, id: string, role: "PC" | "NPC" = "PC") {
  return resetCharacter(entry.character, id, role);
}

function isCharacterLike(value: unknown): value is Character {
  if (!value || typeof value !== "object") return false;
  const character = value as Partial<Character>;
  return typeof character.name === "string"
    && typeof character.faction === "string"
    && typeof character.rank === "string"
    && Array.isArray(character.skills)
    && Array.isArray(character.ninpoIds)
    && Array.isArray(character.backgroundItems)
    && Array.isArray(character.closedGaps)
    && Boolean(character.life && typeof character.life === "object")
    && Boolean(character.tools && typeof character.tools === "object");
}

export function normalizeCharacterLibrary(input: unknown): CharacterLibraryEntry[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const entry = value as Partial<CharacterLibraryEntry>;
    if (entry.schemaVersion !== 1 || typeof entry.id !== "string" || typeof entry.savedAt !== "string" || !isCharacterLike(entry.character)) return [];
    const normalized = createCharacterLibraryEntry(entry.character, { id: entry.id, savedAt: entry.savedAt });
    return [normalized];
  }).sort((a, b) => b.savedAt.localeCompare(a.savedAt)).slice(0, CHARACTER_LIBRARY_LIMIT);
}
