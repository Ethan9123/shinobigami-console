import { useEffect, useMemo, useState } from "react";
import type { SetStateAction } from "react";
import { ACADEMY_PROGRESS_KEY, normalizeAcademyProgress } from "../../../lib/academy";
import { CHARACTER_LIBRARY_STORAGE_KEY, normalizeCharacterLibrary } from "../../../lib/character-library";
import type { CharacterLibraryEntry } from "../../../lib/character-library";
import { LOCALE_STORAGE_KEY, normalizeLocale } from "../../../lib/i18n";
import type { Locale } from "../../../lib/i18n";
import { uid } from "../../../lib/rules";
import { createInitialGameState, normalizeGameState, starterLogs } from "../../../lib/session";
import type { Character, GameState, LogEntry } from "../../../lib/session";

export const STORAGE_KEY = "shinobigami-console-v1";
export const INITIAL_STATE = createInitialGameState();

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export function useGameStore() {
  const [game, setGame] = useState<GameState>(INITIAL_STATE);
  const [history, setHistory] = useState<GameState[]>([]);
  const [locale, setLocale] = useState<Locale>("zh");
  const [academyDone, setAcademyDone] = useState<string[]>([]);
  const [characterLibrary, setCharacterLibrary] = useState<CharacterLibraryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // 更新为同一个值时沿用原对象，保持与各字段独立 useState 相同的跳过更新行为
  const fieldSetters = useMemo(() => {
    const field = <K extends keyof GameState>(key: K) => (update: SetStateAction<GameState[K]>) => setGame((current) => {
      const next = typeof update === "function" ? (update as (previous: GameState[K]) => GameState[K])(current[key]) : update;
      return Object.is(next, current[key]) ? current : { ...current, [key]: next };
    });
    return {
      setCharacters: field("characters"),
      setSelectedId: field("selectedId"),
      setRound: field("round"),
      setRevealed: field("revealed"),
      setLogs: field("logs"),
      setPhase: field("phase"),
      setTurnIndex: field("turnIndex"),
      setCustomNinpo: field("customNinpo"),
      setCycle: field("cycle"),
      setSceneNumber: field("sceneNumber"),
      setSceneOwnerId: field("sceneOwnerId"),
      setSceneParticipantIds: field("sceneParticipantIds"),
      setSceneAction: field("sceneAction"),
      setSceneNote: field("sceneNote"),
      setEmotions: field("emotions"),
      setIntel: field("intel"),
      setCues: field("cues"),
      setTrackers: field("trackers"),
      setTreasures: field("treasures"),
      setBrief: field("brief"),
      setHandouts: field("handouts"),
      setResolution: field("resolution"),
      setTutorial: field("tutorial"),
      setTranscript: field("transcript"),
      setReplay: field("replay"),
    };
  }, []);
  const { setLogs, setCharacters } = fieldSetters;
  const { round, cycle } = game;

  useEffect(() => {
    let restored: GameState | null = null;
    let storedLocale: string | null = null;
    let storedAcademy: unknown = [];
    let storedCharacterLibrary: unknown = [];
    try {
      storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
      storedAcademy = JSON.parse(localStorage.getItem(ACADEMY_PROGRESS_KEY) ?? "[]");
      storedCharacterLibrary = JSON.parse(localStorage.getItem(CHARACTER_LIBRARY_STORAGE_KEY) ?? "[]");
    } catch { /* 独立小键损坏时忽略 */ }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) restored = normalizeGameState(JSON.parse(saved));
    } catch {
      // Ignore invalid device-local data and start from the safe sample.
    }
    queueMicrotask(() => {
      setLocale(normalizeLocale(storedLocale));
      setAcademyDone(normalizeAcademyProgress(storedAcademy));
      setCharacterLibrary(normalizeCharacterLibrary(storedCharacterLibrary));
      if (restored) setGame({ ...restored, logs: restored.logs.length ? restored.logs : starterLogs });
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    } catch {
      // A large portrait or transcript can exceed the browser quota; JSON export remains available as a fallback.
    }
  }, [game, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CHARACTER_LIBRARY_STORAGE_KEY, JSON.stringify(characterLibrary));
    } catch {
      // Device storage may be full or disabled. The in-memory library remains usable for this tab.
    }
  }, [characterLibrary, hydrated]);

  const currentState = (): GameState => game;
  const checkpoint = () => setHistory((items) => [...items.slice(-19), cloneState(currentState())]);
  const addLog = (text: string, tone: LogEntry["tone"] = "action", logCycle = cycle) => {
    setLogs((items) => [...items.slice(-499), { id: uid("log"), round, cycle: logCycle, tone, text }]);
  };
  const updateCharacter = (id: string, patch: Partial<Character>) => {
    setCharacters((items) => items.map((character) => character.id === id ? { ...character, ...patch } : character));
  };

  const persistLocale = (next: Locale) => {
    try { localStorage.setItem(LOCALE_STORAGE_KEY, next); } catch { /* 存储满时忽略 */ }
  };
  const persistAcademyProgress = (next: string[]) => {
    try { localStorage.setItem(ACADEMY_PROGRESS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setGame(previous);
    setHistory((items) => items.slice(0, -1));
  };

  return {
    ...game,
    ...fieldSetters,
    game,
    setGame,
    history,
    setHistory,
    locale,
    setLocale,
    academyDone,
    setAcademyDone,
    characterLibrary,
    setCharacterLibrary,
    hydrated,
    currentState,
    checkpoint,
    addLog,
    updateCharacter,
    persistLocale,
    persistAcademyProgress,
    undo,
  };
}

export type GameStore = ReturnType<typeof useGameStore>;
