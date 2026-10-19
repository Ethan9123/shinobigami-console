import { useEffect, useMemo, useState } from "react";
import type { SetStateAction } from "react";
import { ACADEMY_PROGRESS_KEY } from "../../../lib/academy";
import { CHARACTER_LIBRARY_STORAGE_KEY } from "../../../lib/character-library";
import type { CharacterLibraryEntry } from "../../../lib/character-library";
import { LOCALE_STORAGE_KEY } from "../../../lib/i18n";
import type { Locale } from "../../../lib/i18n";
import { parseAcademy, parseLibrary, parseLocale, parseSession, SESSION_STORAGE_KEY } from "../../../lib/backup";
import { uid } from "../../../lib/rules";
import { createInitialGameState } from "../../../lib/session";
import type { Character, GameState, LogEntry } from "../../../lib/session";
import { useDeviceState } from "./useDeviceState";

export const STORAGE_KEY = SESSION_STORAGE_KEY;
export const INITIAL_STATE = createInitialGameState();

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export function useGameStore() {
  const sessionStorage = useDeviceState(STORAGE_KEY, INITIAL_STATE, (raw) => parseSession(JSON.parse(raw)));
  const libraryStorage = useDeviceState<CharacterLibraryEntry[]>(CHARACTER_LIBRARY_STORAGE_KEY, [], (raw) => parseLibrary(JSON.parse(raw)));
  const academyStorage = useDeviceState<string[]>(ACADEMY_PROGRESS_KEY, [], (raw) => parseAcademy(JSON.parse(raw)));
  const localeStorage = useDeviceState<Locale>(LOCALE_STORAGE_KEY, "zh", parseLocale, (value) => value);
  const { value: game, setValue: setGame } = sessionStorage;
  const { value: characterLibrary, setValue: setCharacterLibrary } = libraryStorage;
  const { value: academyDone, setValue: setAcademyDone } = academyStorage;
  const { value: locale, setValue: setLocale } = localeStorage;
  const [history, setHistory] = useState<GameState[]>([]);
  const storageSlots = [
    { ...sessionStorage, label: "会话" },
    { ...libraryStorage, label: "角色库" },
    { ...academyStorage, label: "学习进度" },
    { ...localeStorage, label: "语言偏好" },
  ];
  const hydrated = storageSlots.every((slot) => slot.hydrated);
  const storageUnsafe = hydrated && storageSlots.some((slot) => slot.status !== "saved");

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
  }, [setGame]);
  const { setLogs, setCharacters } = fieldSetters;
  const { round, cycle } = game;

  useEffect(() => {
    if (!storageUnsafe) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [storageUnsafe]);

  const currentState = (): GameState => game;
  const checkpoint = () => setHistory((items) => [...items.slice(-19), cloneState(currentState())]);
  const addLog = (text: string, tone: LogEntry["tone"] = "action", logCycle = cycle) => {
    setLogs((items) => [...items.slice(-499), { id: uid("log"), round, cycle: logCycle, tone, text }]);
  };
  const updateCharacter = (id: string, patch: Partial<Character>) => {
    setCharacters((items) => items.map((character) => character.id === id ? { ...character, ...patch } : character));
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
    storageSlots,
    storageUnsafe,
    readRawDeviceData: () => Object.fromEntries(storageSlots.map(({ key }) => [key, window.localStorage.getItem(key)])),
    currentState,
    checkpoint,
    addLog,
    updateCharacter,
    undo,
  };
}

export type GameStore = ReturnType<typeof useGameStore>;
