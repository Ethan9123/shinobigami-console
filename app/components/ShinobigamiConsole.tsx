"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  BackgroundItem,
  calculateCheckOdds,
  COMMON_NINPO,
  CONDITIONS,
  EMOTION_PAIRS,
  evaluateSessionReadiness,
  FIELD_NAMES,
  FieldName,
  findSkillPosition,
  checkFumbleLine,
  makeLife,
  nearestSkill,
  Ninpo,
  parseCharacterText,
  rollD6,
  SKILL_TABLE,
  substituteSkill,
  uid,
} from "../lib/rules";
import {
  advanceResolutionAfterRoll,
  createInitialGameState,
  makeDefaultHandouts,
  normalizeGameState,
  starterLogs,
} from "../lib/session";
import type {
  Character,
  Emotion,
  GameState,
  Handout,
  IntelKind,
  IntelRecord,
  LogEntry,
  Phase,
  Resolution,
  SceneAction,
  SceneCue,
  SessionBrief,
  Treasure,
} from "../lib/session";
import { getTutorialStep, RAIN_ZERO_LINE } from "../lib/tutorial";
import type { TutorialState } from "../lib/tutorial";
import { parseTranscript } from "../lib/transcript";
import type { TranscriptArchive, TranscriptEntry } from "../lib/transcript";
import { generateReplay } from "../lib/replay";
import type { GeneratedReplay, ReplayEnding, ReplayGenre, ReplayLength, ReplayMode } from "../lib/replay";
import { createBCDicePalette, createCCFoliaCharacter, createFoundryActor, serializeInterop } from "../lib/interop";
import { composeGmNote, createGmBrief, GM_BEATS } from "../lib/gm";
import type { GmBeat, GmPressure } from "../lib/gm";
import { askSceneOracle, calculateSpotlightLedger, generateSceneDeck, listSceneCardDecks } from "../lib/director";
import type { SceneCard, SceneCardKind, SceneOracleLikelihood, SceneOracleResult } from "../lib/director";
import TutorialRunner from "./tutorial/TutorialRunner";
import { DICE_MAIDEN_HINT, rollDiceCommand } from "../lib/dice";

const STORAGE_KEY = "shinobigami-console-v1";
const INITIAL_STATE = createInitialGameState();

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export default function ShinobigamiConsole() {
  const [characters, setCharacters] = useState(INITIAL_STATE.characters);
  const [selectedId, setSelectedId] = useState(INITIAL_STATE.selectedId);
  const [round, setRound] = useState(INITIAL_STATE.round);
  const [revealed, setRevealed] = useState(INITIAL_STATE.revealed);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_STATE.logs);
  const [history, setHistory] = useState<GameState[]>([]);
  const [view, setView] = useState<"tutorial" | "prep" | "battle" | "sheet" | "replay" | "director">("tutorial");
  const [targetSkill, setTargetSkill] = useState("刀术");
  const [substituteSkillChoice, setSubstituteSkillChoice] = useState("auto");
  const [modifier, setModifier] = useState(0);
  const [lastRoll, setLastRoll] = useState<{ dice: number[]; kept: number[]; total: number; result: string } | null>(null);
  const [selectedNinpoId, setSelectedNinpoId] = useState("close");
  const [targetId, setTargetId] = useState(INITIAL_STATE.characters[1].id);
  const [phase, setPhase] = useState<Phase>(INITIAL_STATE.phase);
  const [turnIndex, setTurnIndex] = useState(0);
  const [customNinpo, setCustomNinpo] = useState<Ninpo[]>([]);
  const [diceCount, setDiceCount] = useState(2);
  const [tableSafe, setTableSafe] = useState(false);
  const [diceInput, setDiceInput] = useState("");
  const [diceHint, setDiceHint] = useState("");
  const [sideView, setSideView] = useState<"log" | "rules" | "assistant">("assistant");
  const [customName, setCustomName] = useState("");
  const [customSkill, setCustomSkill] = useState("刀术");
  const [customRange, setCustomRange] = useState(1);
  const [customCost, setCustomCost] = useState(0);
  const [customKind, setCustomKind] = useState<Ninpo["kind"]>("攻击");
  const [customSummary, setCustomSummary] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [cycle, setCycle] = useState(1);
  const [sceneNumber, setSceneNumber] = useState(1);
  const [sceneOwnerId, setSceneOwnerId] = useState(INITIAL_STATE.sceneOwnerId);
  const [sceneParticipantIds, setSceneParticipantIds] = useState<string[]>(INITIAL_STATE.sceneParticipantIds);
  const [sceneAction, setSceneAction] = useState<SceneAction>("未定");
  const [sceneNote, setSceneNote] = useState("");
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [intel, setIntel] = useState<IntelRecord[]>([]);
  const [cues, setCues] = useState<SceneCue[]>([]);
  const [trackers, setTrackers] = useState(INITIAL_STATE.trackers);
  const [treasures, setTreasures] = useState<Treasure[]>(INITIAL_STATE.treasures);
  const [treasureName, setTreasureName] = useState("");
  const [treasureNote, setTreasureNote] = useState("");
  const [treasureTargets, setTreasureTargets] = useState<Record<string, string>>({});
  const [brief, setBrief] = useState<SessionBrief>(INITIAL_STATE.brief);
  const [handouts, setHandouts] = useState<Handout[]>(INITIAL_STATE.handouts);
  const [resolution, setResolution] = useState<Resolution | null>(INITIAL_STATE.resolution);
  const [tutorial, setTutorial] = useState<TutorialState>(INITIAL_STATE.tutorial);
  const [transcript, setTranscript] = useState<TranscriptArchive | null>(INITIAL_STATE.transcript);
  const [replay, setReplay] = useState<GeneratedReplay | null>(INITIAL_STATE.replay);
  const [replayMode, setReplayMode] = useState<ReplayMode>("戏剧节拍");
  const [replayGenre, setReplayGenre] = useState<ReplayGenre>("都市悬疑");
  const [replayLength, setReplayLength] = useState<ReplayLength>("标准");
  const [replayEnding, setReplayEnding] = useState<ReplayEnding>("苦涩胜利");
  const [replayIntensity, setReplayIntensity] = useState<1 | 2 | 3>(2);
  const [replaySeed, setReplaySeed] = useState("tsuioku-01");
  const [replayHeroId, setReplayHeroId] = useState(INITIAL_STATE.characters.find((character) => character.role === "PC")?.id ?? INITIAL_STATE.selectedId);
  const [replayRevealSecrets, setReplayRevealSecrets] = useState(false);
  const [interopPrivate, setInteropPrivate] = useState(false);
  const [gmBeat, setGmBeat] = useState<GmBeat>("定调");
  const [gmPressure, setGmPressure] = useState<GmPressure>(1);
  const [sceneDeckNonce, setSceneDeckNonce] = useState(0);
  const [lockedSceneCards, setLockedSceneCards] = useState<Partial<Record<SceneCardKind, SceneCard>>>({});
  const [oracleQuestion, setOracleQuestion] = useState("");
  const [oracleLikelihood, setOracleLikelihood] = useState<SceneOracleLikelihood>("五五开");
  const [oracleResult, setOracleResult] = useState<SceneOracleResult | null>(null);
  const [oracleNonce, setOracleNonce] = useState(0);
  const [transcriptDraft, setTranscriptDraft] = useState("");
  const [transcriptQuery, setTranscriptQuery] = useState("");
  const [transcriptSpeaker, setTranscriptSpeaker] = useState("");
  const [transcriptSceneId, setTranscriptSceneId] = useState("all");
  const [emotionFromId, setEmotionFromId] = useState(INITIAL_STATE.characters[0].id);
  const [emotionToId, setEmotionToId] = useState(INITIAL_STATE.characters[1].id);
  const [emotionIndex, setEmotionIndex] = useState(0);
  const [emotionPositive, setEmotionPositive] = useState(true);
  const [intelReceiverId, setIntelReceiverId] = useState(INITIAL_STATE.characters[0].id);
  const [intelSubjectId, setIntelSubjectId] = useState(INITIAL_STATE.characters[1].id);
  const [intelKind, setIntelKind] = useState<IntelKind>("秘密");
  const [cueTitle, setCueTitle] = useState("");
  const [cueCycle, setCueCycle] = useState(1);
  const [cueScene, setCueScene] = useState(1);
  const [trackerName, setTrackerName] = useState("");
  const [trackerMax, setTrackerMax] = useState(6);
  const [importText, setImportText] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const portraitRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLInputElement>(null);

  const selected = characters.find((character) => character.id === selectedId) ?? characters[0];
  const target = characters.find((character) => character.id === targetId && character.id !== selected?.id && character.active)
    ?? characters.find((character) => character.id !== selected?.id && character.active);
  const allNinpo = useMemo(() => [...COMMON_NINPO, ...customNinpo], [customNinpo]);
  const replayCast = useMemo(() => characters.map((character) => ({
    id: character.id,
    name: character.name,
    role: character.role,
    faction: character.faction,
    mission: character.mission,
    secret: character.secret,
    belief: character.belief,
    story: character.story,
    ougi: character.ougi,
    skills: character.skills,
    ninpoNames: character.ninpoIds.map((id) => allNinpo.find((ninpo) => ninpo.id === id)?.name).filter((name): name is string => Boolean(name)),
  })), [allNinpo, characters]);
  const requestedNinpo = allNinpo.find((ninpo) => ninpo.id === selectedNinpoId);
  const firstActiveNinpo = allNinpo.find((ninpo) => selected?.ninpoIds.includes(ninpo.id) && ninpo.kind !== "装备");
  const activeNinpoId = selected?.ninpoIds.includes(selectedNinpoId) && requestedNinpo?.kind !== "装备" ? selectedNinpoId : firstActiveNinpo?.id ?? "close";
  const selectedNinpo = allNinpo.find((ninpo) => ninpo.id === activeNinpoId) ?? COMMON_NINPO[0];
  const learnedNinpo = selected ? allNinpo.filter((ninpo) => selected.ninpoIds.includes(ninpo.id) && ninpo.kind !== "装备") : COMMON_NINPO.slice(0, 2);
  const availableSkills = useMemo(
    () => (selected?.skills ?? []).filter((skill) => {
      const position = findSkillPosition(skill);
      return position ? selected.life[FIELD_NAMES[position.field]] : false;
    }),
    [selected],
  );
  const automaticCheck = nearestSkill(availableSkills, targetSkill, selected?.closedGaps ?? []);
  const check = substituteSkillChoice === "auto"
    ? automaticCheck
    : substituteSkill(availableSkills, targetSkill, substituteSkillChoice, selected?.closedGaps ?? []);
  const battleOrder = useMemo(
    () => characters.filter((character) => character.active).sort((a, b) => (b.plot ?? -1) - (a.plot ?? -1)),
    [characters],
  );
  const currentActor = battleOrder.length ? battleOrder[turnIndex % battleOrder.length] : null;
  const inAttackWindow = view === "battle" && revealed;
  const fumbleLine = checkFumbleLine({ inAttackWindow, plot: selected?.plot });
  const odds = useMemo(
    () => calculateCheckOdds(diceCount, check.target, modifier, 12, fumbleLine, check.criticalOnly),
    [check.criticalOnly, check.target, diceCount, modifier, fumbleLine],
  );
  const importPreview = useMemo(() => parseCharacterText(importText), [importText]);
  const filteredTranscript = useMemo(() => {
    if (!transcript) return [];
    const query = transcriptQuery.trim().toLocaleLowerCase("zh-CN");
    return transcript.entries.filter((entry) => (
      (transcriptSceneId === "all" || entry.sceneId === transcriptSceneId)
      && (!transcriptSpeaker || entry.speaker === transcriptSpeaker)
      && (!query || `${entry.speaker} ${entry.text}`.toLocaleLowerCase("zh-CN").includes(query))
    )).slice(0, 800);
  }, [transcript, transcriptQuery, transcriptSceneId, transcriptSpeaker]);
  const dueCues = useMemo(
    () => cues.filter((cue) => !cue.done && (cue.cycle < cycle || (cue.cycle === cycle && cue.scene <= sceneNumber))),
    [cues, cycle, sceneNumber],
  );
  const gmBrief = createGmBrief({
    title: brief.title,
    cycle,
    sceneNumber,
    sceneOwnerId,
    sceneParticipantIds,
    sceneAction,
    characters,
    emotions,
    intel,
    trackers,
    cues,
    logs,
    beat: gmBeat,
    pressure: gmPressure,
    tableSafe,
  });
  const spotlightLedger = useMemo(
    () => calculateSpotlightLedger(characters, logs),
    [characters, logs],
  );
  const sceneCards = useMemo(
    () => generateSceneDeck({
      title: brief.title,
      cycle,
      sceneNumber,
      action: sceneAction,
      tension: gmBrief.tension,
      spotlightName: gmBrief.spotlight.name,
    }, sceneDeckNonce).map((card) => lockedSceneCards[card.kind] ?? card),
    [brief.title, cycle, gmBrief.spotlight.name, gmBrief.tension, lockedSceneCards, sceneAction, sceneDeckNonce, sceneNumber],
  );
  const preflightIssues = useMemo(
    () => evaluateSessionReadiness(characters, handouts, brief.playerCount, brief.requirements),
    [brief, characters, handouts],
  );
  const prepBlockers = preflightIssues.filter((issue) => issue.level === "blocker");
  const prepWarnings = preflightIssues.filter((issue) => issue.level === "warning");
  const resolutionActor = resolution ? characters.find((character) => character.id === resolution.actorId) : null;
  const resolutionTarget = resolution ? characters.find((character) => character.id === resolution.targetId) : null;
  const samePlotBatch = resolutionActor?.plot == null
    ? []
    : characters.filter((character) => character.active && character.plot === resolutionActor.plot);
  const smartHints = useMemo(() => {
    const hints: Array<{ tone: "good" | "warn" | "danger"; title: string; detail: string }> = [];
    const pcs = characters.filter((character) => character.role === "PC");
    if (phase === "导入") {
      hints.push(prepBlockers.length
        ? { tone: "danger", title: `${prepBlockers.length} 项开团阻塞`, detail: prepBlockers.slice(0, 3).map((issue) => issue.message).join("；") }
        : { tone: "good", title: "开团门禁已通过", detail: prepWarnings.length ? `仍有 ${prepWarnings.length} 项可由 GM 确认的提醒。` : "公告、PC 位与角色卡均已确认。" });
    }
    if (phase === "主要") {
      const waiting = pcs.filter((character) => !character.acted);
      hints.push(waiting.length
        ? { tone: "warn", title: `${waiting.length} 位尚未行动`, detail: waiting.map((item) => item.name).join("、") }
        : { tone: "good", title: "本巡行动已完成", detail: "可以结算巡末效果并开始新巡。" });
      if (!sceneParticipantIds.includes(sceneOwnerId)) hints.push({ tone: "danger", title: "场景玩家未登场", detail: "将场景玩家加入登场人物后再完成场景。" });
      if (sceneAction === "未定") hints.push({ tone: "warn", title: "尚未选择主要行动", detail: "回复、情报、感情、战斗或计划判定只能择一作为主要行动。" });
    }
    if (phase === "高潮") {
      const unset = characters.filter((character) => character.active && character.plot == null);
      if (unset.length) hints.push({ tone: "danger", title: "布局尚未齐全", detail: unset.map((item) => item.name).join("、") });
      const ties = battleOrder.filter((item, index) => index > 0 && item.plot === battleOrder[index - 1].plot);
      if (revealed && ties.length) hints.push({ tone: "warn", title: "存在同布局角色", detail: "请按桌上约定或随机方式决定同布局内的处理顺序。" });
    }
    if (resolution && resolution.stage !== "完成") {
      hints.push({ tone: "danger", title: `结算停在「${resolution.stage}」`, detail: `${resolutionActor?.name ?? "行动者"} 的【${resolution.ninpoName}】尚未完成，不应直接跳到下一位。` });
    }
    if (!availableSkills.length) hints.push({ tone: "danger", title: `${selected?.name ?? "角色"} 没有可用特技`, detail: "失去生命力的分野不能用于代用；只有大成功才可能成功。" });
    if (selected && selected.plot != null && selected.spentCost >= selected.plot) hints.push({ tone: "warn", title: "本回合花费已用尽", detail: `${selected.name} 已使用 ${selected.spentCost}/${selected.plot}。` });
    if (dueCues.length) hints.push({ tone: "danger", title: `${dueCues.length} 个主持事件已到点`, detail: tableSafe ? "请切回 GM 视图查看事件内容。" : dueCues.map((cue) => cue.title).join("、") });
    if (!selected?.mission.trim()) hints.push({ tone: "warn", title: "使命尚未填写", detail: "角色卡导入或场景推进前补齐，便于结局检查。" });
    if (!hints.length) hints.push({ tone: "good", title: "当前状态无明显冲突", detail: "可以继续推进场景或判定。" });
    return hints;
  }, [availableSkills.length, battleOrder, characters, dueCues, phase, prepBlockers, prepWarnings.length, resolution, resolutionActor?.name, revealed, sceneAction, sceneOwnerId, sceneParticipantIds, selected, tableSafe]);

  useEffect(() => {
    let restored: GameState | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) restored = normalizeGameState(JSON.parse(saved));
    } catch {
      // Ignore invalid device-local data and start from the safe sample.
    }
    queueMicrotask(() => {
      if (restored) {
        setCharacters(restored.characters);
        setSelectedId(restored.selectedId);
        setRound(restored.round);
        setRevealed(restored.revealed);
        setLogs(restored.logs.length ? restored.logs : starterLogs);
        setPhase(restored.phase);
        setTurnIndex(restored.turnIndex);
        setCustomNinpo(restored.customNinpo);
        setCycle(restored.cycle);
        setSceneNumber(restored.sceneNumber);
        setSceneOwnerId(restored.sceneOwnerId);
        setSceneParticipantIds(restored.sceneParticipantIds);
        setSceneAction(restored.sceneAction);
        setSceneNote(restored.sceneNote);
        setEmotions(restored.emotions);
        setIntel(restored.intel);
        setCues(restored.cues);
        setTrackers(restored.trackers);
        setTreasures(restored.treasures);
        setBrief(restored.brief);
        setHandouts(restored.handouts);
        setResolution(restored.resolution);
        setTutorial(restored.tutorial);
        setTranscript(restored.transcript);
        setReplay(restored.replay);
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
      schemaVersion: 8,
      characters, selectedId, round, revealed, logs, phase, turnIndex, customNinpo,
      cycle, sceneNumber, sceneOwnerId, sceneParticipantIds, sceneAction, sceneNote, emotions, intel, cues, trackers, treasures,
      brief, handouts, resolution, tutorial, transcript, replay,
      }));
    } catch {
      // A large portrait or transcript can exceed the browser quota; JSON export remains available as a fallback.
    }
  }, [characters, selectedId, round, revealed, logs, phase, turnIndex, customNinpo, cycle, sceneNumber, sceneOwnerId, sceneParticipantIds, sceneAction, sceneNote, emotions, intel, cues, trackers, treasures, brief, handouts, resolution, tutorial, transcript, replay, hydrated]);

  const currentState = (): GameState => ({
    schemaVersion: 8,
    characters, selectedId, round, revealed, logs, phase, turnIndex, customNinpo,
    cycle, sceneNumber, sceneOwnerId, sceneParticipantIds, sceneAction, sceneNote, emotions, intel, cues, trackers, treasures,
    brief, handouts, resolution, tutorial, transcript, replay,
  });
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
    setCharacters(previous.characters);
    setSelectedId(previous.selectedId);
    setRound(previous.round);
    setRevealed(previous.revealed);
    setLogs(previous.logs);
    setPhase(previous.phase);
    setTurnIndex(previous.turnIndex);
    setCustomNinpo(previous.customNinpo);
    setCycle(previous.cycle);
    setSceneNumber(previous.sceneNumber);
    setSceneOwnerId(previous.sceneOwnerId);
    setSceneParticipantIds(previous.sceneParticipantIds);
    setSceneAction(previous.sceneAction);
    setSceneNote(previous.sceneNote);
    setEmotions(previous.emotions);
    setIntel(previous.intel);
    setCues(previous.cues);
    setTrackers(previous.trackers);
    setTreasures(previous.treasures);
    setBrief(previous.brief);
    setHandouts(previous.handouts);
    setResolution(previous.resolution);
    setTutorial(previous.tutorial);
    setTranscript(previous.transcript);
    setReplay(previous.replay);
    setHistory((items) => items.slice(0, -1));
  };

  const addCharacter = (role: "PC" | "NPC") => {
    checkpoint();
    const id = uid(role.toLowerCase());
    const character: Character = {
      id,
      name: role === "PC" ? `新忍者 ${characters.filter((c) => c.role === "PC").length + 1}` : `新敌人 ${characters.filter((c) => c.role === "NPC").length + 1}`,
      role, faction: "未选择流派", rank: "中忍", plot: null, active: true, extraLife: 0, life: makeLife(),
      skills: ["刀术"], ninpoIds: ["close", "shoot"], conditions: [], spentCost: 0, usedNinpoIds: [],
      mission: "", secret: "", ougi: "", closedGaps: [false, false, false, false, false], acted: false,
      player: "", age: "", gender: "", cover: "", belief: "", merit: 0, enemy: "", surface: "", story: "", backgrounds: "", backgroundItems: [], portrait: "",
      subFaction: "", condition: "", style: "",
      ougiSkill: "", ougiEffect: "", ougiStrength: "", ougiWeakness: "",
      tools: { 兵粮丸: 1, 神通丸: 1, 遁甲符: 0 },
    };
    setCharacters((items) => [...items, character]);
    setSelectedId(id);
    addLog(`${character.name} 已加入角色列表。`, "system");
  };

  const removeSelected = () => {
    if (!selected || characters.length <= 1) return;
    checkpoint();
    const remaining = characters.filter((character) => character.id !== selected.id);
    setCharacters(remaining);
    setSelectedId(remaining[0].id);
    setEmotions((items) => items.filter((emotion) => emotion.fromId !== selected.id && emotion.toId !== selected.id));
    setIntel((items) => items.filter((record) => record.subjectId !== selected.id).map((record) => ({ ...record, knownBy: record.knownBy.filter((id) => id !== selected.id) })));
    setHandouts((items) => items.map((handout) => handout.assignedCharacterId === selected.id ? { ...handout, assignedCharacterId: "", reviewed: false } : handout));
    setTreasures((items) => items.map((treasure) => treasure.holderId === selected.id ? { ...treasure, holderId: "" } : treasure));
    if (resolution?.actorId === selected.id || resolution?.targetId === selected.id) setResolution(null);
    setSceneParticipantIds((items) => items.filter((id) => id !== selected.id));
    if (sceneOwnerId === selected.id) setSceneOwnerId(remaining[0].id);
    if (emotionFromId === selected.id) setEmotionFromId(remaining[0].id);
    if (emotionToId === selected.id) setEmotionToId(remaining.find((item) => item.id !== remaining[0].id)?.id ?? remaining[0].id);
    if (intelReceiverId === selected.id) setIntelReceiverId(remaining[0].id);
    if (intelSubjectId === selected.id) setIntelSubjectId(remaining.find((item) => item.id !== remaining[0].id)?.id ?? remaining[0].id);
    if (replayHeroId === selected.id) setReplayHeroId(remaining.find((item) => item.role === "PC")?.id ?? remaining[0].id);
    addLog(`${selected.name} 已从控制台移除。`, "danger");
  };

  const toggleSkill = (skill: string) => {
    if (!selected) return;
    checkpoint();
    const skills = selected.skills.includes(skill) ? selected.skills.filter((item) => item !== skill) : [...selected.skills, skill];
    updateCharacter(selected.id, { skills });
  };

  const toggleGap = (index: number) => {
    if (!selected) return;
    checkpoint();
    const closedGaps = [...(selected.closedGaps ?? [false, false, false, false, false])];
    closedGaps[index] = !closedGaps[index];
    updateCharacter(selected.id, { closedGaps });
  };

  const updateBrief = (patch: Partial<SessionBrief>) => {
    setBrief((current) => ({ ...current, ...patch }));
  };

  const updateRequirements = (patch: Partial<SessionBrief["requirements"]>) => {
    setBrief((current) => ({ ...current, requirements: { ...current.requirements, ...patch } }));
  };

  const resizeHandouts = () => {
    checkpoint();
    const generated = makeDefaultHandouts(characters, brief.playerCount);
    setHandouts(generated.map((fresh, index) => ({ ...fresh, ...(handouts[index] ?? {}), id: handouts[index]?.id ?? fresh.id, slot: fresh.slot })));
    addLog(`已按公告人数整理为 ${brief.playerCount} 份 PC 位。`, "system");
  };

  const updateHandout = (id: string, patch: Partial<Handout>) => {
    setHandouts((items) => items.map((handout) => handout.id === id ? { ...handout, ...patch } : handout));
  };

  const applyHandoutToCharacter = (handout: Handout) => {
    const character = characters.find((item) => item.id === handout.assignedCharacterId);
    if (!character) {
      addLog(`${handout.slot} 尚未分配角色，无法同步。`, "danger");
      return;
    }
    checkpoint();
    updateCharacter(character.id, {
      mission: handout.publicMission.trim() || character.mission,
      secret: handout.privateSecret.trim() || character.secret,
    });
    addLog(`已将 ${handout.slot} 的使命与秘密同步给 ${character.name}。`, "system");
  };

  const startSession = () => {
    if (prepBlockers.length) {
      addLog(`开团门禁未通过：仍有 ${prepBlockers.length} 项必须确认。`, "danger");
      return;
    }
    checkpoint();
    setPhase("主要");
    setView("director");
    setGmBeat("定调");
    setGmPressure(1);
    addLog(`《${brief.title}》开团检查完成，进入主要阶段。`, "system");
  };

  const toggleSceneParticipant = (id: string) => {
    setSceneParticipantIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  };

  const appendGmDirection = (kind: "opening" | "question" | "failure" | "aftermath") => {
    checkpoint();
    const direction = composeGmNote(gmBrief, kind);
    setSceneNote((current) => [current.trim(), direction].filter(Boolean).join("\n"));
    addLog(kind === "failure" ? "GM 已记录一个“失败也前进”的剧情代价；不会自动改写判定结果。" : "GM 导演提示已加入当前场景笔记。", kind === "failure" ? "danger" : "system");
  };

  const acceptSuggestedAction = () => {
    checkpoint();
    setSceneAction(gmBrief.suggestedAction);
    addLog(`GM 建议本场以${gmBrief.suggestedAction}聚焦；最终行动仍由场景玩家决定。`, "system");
  };

  const acceptGmSpotlight = () => {
    if (!gmBrief.spotlight.id) return;
    checkpoint();
    setSceneOwnerId(gmBrief.spotlight.id);
    setSelectedId(gmBrief.spotlight.id);
    setSceneParticipantIds((items) => items.includes(gmBrief.spotlight.id) ? items : [...items, gmBrief.spotlight.id]);
    addLog(`聚光灯交给 ${gmBrief.spotlight.name}；请先询问玩家想让这一幕发生什么。`, "system");
  };

  const toggleSceneCardLock = (card: SceneCard) => {
    setLockedSceneCards((current) => {
      if (current[card.kind]) {
        const next = { ...current };
        delete next[card.kind];
        return next;
      }
      return { ...current, [card.kind]: card };
    });
  };

  const rerollSceneCards = () => {
    setSceneDeckNonce((value) => value + 1);
    addLog("场景牌桌已重抽未锁定的灵感牌；不会改变任何规则状态。", "system");
  };

  const appendSceneCard = (card: SceneCard) => {
    checkpoint();
    const note = `【${card.kind} · ${card.title}】${card.body} ${card.prompt}`;
    setSceneNote((current) => [current.trim(), note].filter(Boolean).join("\n"));
    addLog(`“${card.title}”已加入当前场景笔记。`, "system");
  };

  const appendSceneDeck = () => {
    checkpoint();
    const notes = sceneCards.map((card) => `【${card.kind} · ${card.title}】${card.body} ${card.prompt}`).join("\n");
    setSceneNote((current) => [current.trim(), notes].filter(Boolean).join("\n"));
    addLog("整组场景牌已加入当前场景笔记，可继续改写或删减。", "system");
  };

  const runSceneOracle = () => {
    const nextNonce = oracleNonce + 1;
    const question = oracleQuestion.trim() || "接下来最可能改变局势的是什么？";
    const result = askSceneOracle({
      question,
      likelihood: oracleLikelihood,
      tension: gmBrief.tension,
      seed: `${brief.title}:${cycle}:${sceneNumber}:${nextNonce}`,
    });
    setOracleNonce(nextNonce);
    setOracleResult(result);
    addLog(`局势神谕：${result.dice.join("＋")} → ${result.label}。这只是主持灵感，不代替判定。`, "roll");
  };

  const appendOracleResult = () => {
    if (!oracleResult) return;
    checkpoint();
    const note = `【局势神谕 · ${oracleResult.label}】${oracleResult.answer} ${oracleResult.prompt}${oracleResult.twist ? ` 异变：${oracleResult.twist}` : ""}`;
    setSceneNote((current) => [current.trim(), note].filter(Boolean).join("\n"));
    addLog("局势神谕结果已加入当前场景笔记。", "system");
  };

  const advanceGmBeat = () => {
    const index = GM_BEATS.indexOf(gmBeat);
    setGmBeat(GM_BEATS[Math.min(GM_BEATS.length - 1, index + 1)]);
  };

  const completeScene = () => {
    const owner = characters.find((character) => character.id === sceneOwnerId);
    if (!owner || !sceneParticipantIds.includes(owner.id) || sceneAction === "未定") {
      addLog("场景尚未就绪：请确认场景玩家已登场，并选择本场景的主要行动。", "danger");
      return;
    }
    checkpoint();
    updateCharacter(owner.id, { acted: true });
    addLog(`第 ${cycle} 巡第 ${sceneNumber} 场完成：${owner.name} 进行了${sceneAction}${sceneNote.trim() ? `（${sceneNote.trim()}）` : ""}。`, "action");
    const waiting = characters.filter((character) => character.role === "PC" && character.id !== owner.id && !character.acted);
    const nextOwner = waiting[0] ?? characters.find((character) => character.role === "PC") ?? characters[0];
    setSceneNumber((value) => value + 1);
    setSceneOwnerId(nextOwner.id);
    setSceneParticipantIds([nextOwner.id]);
    setSceneAction("未定");
    setSceneNote("");
    setGmBeat("定调");
    setGmPressure((value) => Math.max(0, value - 1) as GmPressure);
    setSceneDeckNonce(0);
    setLockedSceneCards({});
    setOracleQuestion("");
    setOracleResult(null);
  };

  const newCycle = () => {
    checkpoint();
    const nextCycle = cycle + 1;
    const firstPc = characters.find((character) => character.role === "PC") ?? characters[0];
    setCycle(nextCycle);
    setSceneNumber(1);
    setSceneOwnerId(firstPc.id);
    setSceneParticipantIds([firstPc.id]);
    setSceneAction("未定");
    setSceneNote("");
    setGmBeat("定调");
    setGmPressure(1);
    setSceneDeckNonce(0);
    setLockedSceneCards({});
    setOracleQuestion("");
    setOracleResult(null);
    setCharacters((items) => items.map((character) => ({ ...character, acted: false })));
    setEmotions((items) => items.map((emotion) => ({ ...emotion, used: false })));
    addLog(`进入第 ${nextCycle} 巡，所有 PC 恢复未行动状态。`, "system", nextCycle);
  };

  const addEmotion = () => {
    if (emotionFromId === emotionToId) {
      addLog("不能对自己建立感情。", "danger");
      return;
    }
    checkpoint();
    const pair = EMOTION_PAIRS[Math.max(0, Math.min(EMOTION_PAIRS.length - 1, emotionIndex))];
    const label = emotionPositive ? pair[0] : pair[1];
    const next: Emotion = { id: uid("emotion"), fromId: emotionFromId, toId: emotionToId, label, positive: emotionPositive, used: false };
    setEmotions((items) => [...items.filter((item) => !(item.fromId === emotionFromId && item.toId === emotionToId)), next]);
    const from = characters.find((character) => character.id === emotionFromId)?.name ?? "角色";
    const to = characters.find((character) => character.id === emotionToId)?.name ?? "角色";
    addLog(`${from} 对 ${to} 获得${emotionPositive ? "正面" : "负面"}感情「${label}」。`, "action");
  };

  const markEmotionUsed = (emotionId: string) => {
    checkpoint();
    setEmotions((items) => items.map((emotion) => emotion.id === emotionId ? { ...emotion, used: !emotion.used } : emotion));
  };

  const gainIntel = () => {
    const receiver = characters.find((character) => character.id === intelReceiverId);
    const subject = characters.find((character) => character.id === intelSubjectId);
    if (!receiver || !subject) return;
    checkpoint();
    const sharedTo = emotions.filter((emotion) => emotion.toId === receiver.id).map((emotion) => emotion.fromId);
    const recipients = Array.from(new Set([receiver.id, ...sharedTo]));
    setIntel((items) => {
      const existing = items.find((record) => record.subjectId === subject.id && record.kind === intelKind);
      if (!existing) return [...items, { subjectId: subject.id, kind: intelKind, knownBy: recipients }];
      return items.map((record) => record === existing ? { ...record, knownBy: Array.from(new Set([...record.knownBy, ...recipients])) } : record);
    });
    const sharedNames = sharedTo.map((id) => characters.find((character) => character.id === id)?.name).filter(Boolean);
    addLog(`${receiver.name} 直接获得 ${subject.name} 的【${intelKind}】${sharedNames.length ? `；因感情自动共享给 ${sharedNames.join("、")}（不再连锁）` : ""}。`, "action");
  };

  const addCue = () => {
    if (!cueTitle.trim()) return;
    checkpoint();
    setCues((items) => [...items, { id: uid("cue"), title: cueTitle.trim(), cycle: Math.max(1, cueCycle), scene: Math.max(1, cueScene), done: false }]);
    setCueTitle("");
  };

  const toggleCue = (id: string) => {
    checkpoint();
    setCues((items) => items.map((cue) => cue.id === id ? { ...cue, done: !cue.done } : cue));
  };

  const updateTracker = (id: string, delta: number) => {
    checkpoint();
    setTrackers((items) => items.map((tracker) => tracker.id === id ? { ...tracker, value: Math.max(0, Math.min(tracker.max, tracker.value + delta)) } : tracker));
  };

  const addTracker = () => {
    if (!trackerName.trim()) return;
    checkpoint();
    setTrackers((items) => [...items, { id: uid("tracker"), name: trackerName.trim(), value: 0, max: Math.max(2, trackerMax) }]);
    setTrackerName("");
  };

  const addTreasure = () => {
    const name = treasureName.trim();
    if (!name) return;
    checkpoint();
    setTreasures((items) => [...items, { id: uid("treasure"), name, holderId: characters[0]?.id ?? "", note: treasureNote.trim() }]);
    setTreasureName("");
    setTreasureNote("");
    addLog(`秘宝〈${name}〉已登记，当前由 ${characters[0]?.name ?? "无人"} 持有。`, "system");
  };

  const removeTreasure = (treasureId: string) => {
    const treasure = treasures.find((item) => item.id === treasureId);
    if (!treasure) return;
    checkpoint();
    setTreasures((items) => items.filter((item) => item.id !== treasureId));
    addLog(`秘宝〈${treasure.name}〉已从桌面移除。`, "system");
  };

  const transferTreasure = (treasureId: string, targetId: string) => {
    const treasure = treasures.find((item) => item.id === treasureId);
    const nextHolder = characters.find((character) => character.id === targetId);
    if (!treasure || !nextHolder || treasure.holderId === nextHolder.id) return;
    checkpoint();
    setTreasures((items) => items.map((item) => item.id === treasureId ? { ...item, holderId: nextHolder.id } : item));
    const fromName = characters.find((character) => character.id === treasure.holderId)?.name ?? "无人";
    addLog(`秘宝〈${treasure.name}〉由 ${fromName} 让渡给 ${nextHolder.name}。`, "action");
  };

  const addBackgroundItem = () => {
    if (!selected) return;
    checkpoint();
    updateCharacter(selected.id, {
      backgroundItems: [...selected.backgroundItems, { id: uid("bg"), serial: "", name: "新背景", category: "", points: 0, effect: "" }],
    });
  };

  const updateBackgroundItem = (itemId: string, patch: Partial<BackgroundItem>) => {
    if (!selected) return;
    updateCharacter(selected.id, {
      backgroundItems: selected.backgroundItems.map((item) => item.id === itemId ? { ...item, ...patch } : item),
    });
  };

  const removeBackgroundItem = (itemId: string) => {
    if (!selected) return;
    checkpoint();
    updateCharacter(selected.id, { backgroundItems: selected.backgroundItems.filter((item) => item.id !== itemId) });
  };

  const applyCharacterImport = () => {
    if (!selected || !importPreview.recognized) return;
    checkpoint();
    updateCharacter(selected.id, {
      name: importPreview.name ?? selected.name,
      faction: importPreview.faction ?? selected.faction,
      subFaction: importPreview.subFaction ?? selected.subFaction,
      condition: importPreview.condition ?? selected.condition,
      style: importPreview.style ?? selected.style,
      rank: importPreview.rank ?? selected.rank,
      player: importPreview.player ?? selected.player,
      age: importPreview.age ?? selected.age,
      gender: importPreview.gender ?? selected.gender,
      cover: importPreview.cover ?? selected.cover,
      belief: importPreview.belief ?? selected.belief,
      merit: importPreview.merit ?? selected.merit,
      enemy: importPreview.enemy ?? selected.enemy,
      surface: importPreview.surface ?? selected.surface,
      story: importPreview.story ?? selected.story,
      backgrounds: importPreview.backgrounds ?? selected.backgrounds,
      backgroundItems: importPreview.backgroundItems.length ? importPreview.backgroundItems : selected.backgroundItems,
      mission: importPreview.mission ?? selected.mission,
      secret: importPreview.secret ?? selected.secret,
      ougi: importPreview.ougi ?? selected.ougi,
      ougiSkill: importPreview.ougiSkill ?? selected.ougiSkill,
      ougiEffect: importPreview.ougiEffect ?? selected.ougiEffect,
      ougiStrength: importPreview.ougiStrength ?? selected.ougiStrength,
      ougiWeakness: importPreview.ougiWeakness ?? selected.ougiWeakness,
      skills: importPreview.skills.length ? importPreview.skills : selected.skills,
      ninpoIds: importPreview.ninpoIds.length ? Array.from(new Set([...selected.ninpoIds, ...importPreview.ninpoIds])) : selected.ninpoIds,
    });
    addLog(`已从纯文字角色卡识别 ${importPreview.recognized} 个字段并更新 ${importPreview.name ?? selected.name}。`, "system");
    setImportText("");
  };

  const importPortrait = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selected || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSide = 720;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        checkpoint();
        updateCharacter(selected.id, { portrait: canvas.toDataURL("image/jpeg", 0.82) });
        addLog(`${selected.name} 的本地角色立绘已更新。`, "system");
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const loadTranscript = (text: string, sourceName: string) => {
    const archive = parseTranscript(text, sourceName);
    if (!archive.entries.length) {
      addLog("没有从文本中识别到可用的跑团记录。", "danger");
      return;
    }
    checkpoint();
    setTranscript(archive);
    setTranscriptSceneId("all");
    setTranscriptSpeaker("");
    setTranscriptQuery("");
    setTranscriptDraft("");
    addLog(`已在本机解析《${sourceName}》：${archive.scenes.length} 个片段、${archive.entries.length} 条记录。`, "system");
  };

  const importTranscriptFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadTranscript(String(reader.result), file.name.replace(/\.[^.]+$/, ""));
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  };

  const appendTranscriptEntry = (entry: TranscriptEntry) => {
    const quote = `${entry.speaker ? `${entry.speaker}：` : ""}${entry.text}`;
    setSceneNote((note) => [note.trim(), quote].filter(Boolean).join("\n"));
    addLog(`已将记录第 ${entry.line} 行加入当前场景笔记。`, "system");
  };

  const createReplay = (nextSeed = replaySeed) => {
    const protagonistId = characters.some((character) => character.id === replayHeroId)
      ? replayHeroId
      : characters.find((character) => character.role === "PC")?.id ?? characters[0].id;
    const seed = nextSeed.trim() || "shinobigami";
    checkpoint();
    const generated = generateReplay(replayCast, {
      title: brief.title,
      genre: replayGenre,
      length: replayLength,
      ending: replayEnding,
      intensity: replayIntensity,
      seed,
      protagonistId,
      revealSecrets: replayRevealSecrets && !tableSafe,
      mode: replayMode,
    });
    setReplaySeed(seed);
    setReplayHeroId(protagonistId);
    setReplay(generated);
    addLog(`已用种子「${seed}」以「${replayMode}」模式生成 ${generated.stats.sceneCount} 幕自动 Replay。`, "system");
  };

  const rerollReplay = () => createReplay(`replay-${Date.now().toString(36).slice(-7)}`);

  const exportReplay = () => {
    if (!replay) return;
    const blob = new Blob([replay.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${replay.title.replace(/[\\/:*?"<>|]/g, "-")}-Replay-${replay.seed}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    addLog(`已导出《${replay.title}》自动 Replay 文本。`, "system");
  };

  const sendReplayToDesk = () => {
    if (!replay) return;
    const archive = parseTranscript(replay.text, `${replay.title} · 自动 Replay`);
    setTranscript(archive);
    setTranscriptSceneId("all");
    setTranscriptSpeaker("");
    setTranscriptQuery("");
    setView("director");
    addLog(`自动 Replay 已送入跑团记录台，可按场景、角色与关键词继续导演。`, "system");
  };

  const copyInteropText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addLog(`${selected.name} 的${label}已复制到剪贴板。`, "system");
    } catch {
      addLog(`无法写入剪贴板；请确认页面使用 HTTPS，并允许浏览器访问剪贴板。`, "danger");
    }
  };

  const copyBCDicePalette = () => {
    void copyInteropText(createBCDicePalette(selected, allNinpo), " BCDice 命令调色板");
  };

  const copyCCFoliaCharacter = () => {
    const data = createCCFoliaCharacter(selected, allNinpo, { includePrivate: interopPrivate && !tableSafe });
    void copyInteropText(serializeInterop(data), " CCFOLIA 角色数据");
  };

  const downloadFoundryActor = () => {
    const data = createFoundryActor(selected, allNinpo, { includePrivate: interopPrivate && !tableSafe });
    const blob = new Blob([serializeInterop(data)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selected.name.replace(/[\\/:*?"<>|]/g, "-")}-FoundryVTT-Actor.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    addLog(`${selected.name} 的 Foundry VTT Actor JSON 已导出。`, "system");
  };

  const toggleLife = (field: FieldName) => {
    if (!selected) return;
    checkpoint();
    const next = { ...selected.life, [field]: !selected.life[field] };
    updateCharacter(selected.id, { life: next });
    addLog(`${selected.name} 的${field}生命力${next[field] ? "恢复" : "失去"}。`, next[field] ? "action" : "danger");
  };

  const setPlot = (character: Character, plot: number) => {
    checkpoint();
    updateCharacter(character.id, { plot });
    setRevealed(false);
    addLog(`${character.name} 已秘密设置布局。`, "system");
  };

  const revealPlots = () => {
    checkpoint();
    setRevealed(true);
    setTurnIndex(0);
    if (battleOrder[0]) setSelectedId(battleOrder[0].id);
    const summary = battleOrder.map((character) => `${character.name} ${character.plot ?? "?"}`).join("／");
    addLog(`布局公开：${summary}`, "action");
  };

  const advanceTurn = () => {
    if (!revealed || !battleOrder.length) return;
    if (resolution && resolution.stage !== "完成") {
      addLog(`不能切换行动者：当前结算仍停在「${resolution.stage}」。`, "danger");
      return;
    }
    checkpoint();
    setResolution(null);
    const nextIndex = (turnIndex + 1) % battleOrder.length;
    setTurnIndex(nextIndex);
    setSelectedId(battleOrder[nextIndex].id);
    addLog(nextIndex === 0 ? "本回合所有角色均已行动。" : `轮到 ${battleOrder[nextIndex].name} 行动。`, "system");
  };

  const newRound = () => {
    if (resolution && resolution.stage !== "完成") {
      addLog(`不能开始新回合：当前结算仍停在「${resolution.stage}」。`, "danger");
      return;
    }
    checkpoint();
    setResolution(null);
    setRound((value) => value + 1);
    setRevealed(false);
    setLastRoll(null);
    setTurnIndex(0);
    setCharacters((items) => items.map((character) => ({
      ...character,
      plot: null,
      spentCost: 0,
      usedNinpoIds: [],
      conditions: character.conditions.filter((item) => item !== "逆止"),
    })));
    setEmotions((items) => items.map((emotion) => ({ ...emotion, used: false })));
    addLog(`进入第 ${round + 1} 回合，请重新设置布局。`, "system");
  };

  const rollCheck = () => {
    if (!selected) return;
    checkpoint();
    const dice = Array.from({ length: diceCount }, () => rollD6());
    const kept = [...dice].sort((a, b) => b - a).slice(0, 2);
    const raw = kept[0] + kept[1];
    const total = raw + modifier;
    const fumbleLine = checkFumbleLine({ inAttackWindow, plot: selected.plot });
    let result = !check.criticalOnly && total >= check.target ? "成功" : "失败";
    if (raw >= 12) result = "大成功";
    if (raw <= fumbleLine) result = inAttackWindow ? "大失败／逆止" : "大失败";
    setLastRoll({ dice, kept, total, result });
    if (resolution) setResolution(advanceResolutionAfterRoll(resolution, selected.id, result));
    const command = `${diceCount > 2 ? diceCount : ""}SG@12#${fumbleLine}>=${check.criticalOnly ? 99 : check.target}`;
    const poolText = diceCount > 2 ? `${dice.join(",")} → 取高 ${kept.join("+")}` : kept.join("+");
    const skillPhrase = check.skill === targetSkill ? `以${check.skill}判定` : `以${check.skill}代用${targetSkill}`;
    addLog(`[${command}] ${selected.name} ${skillPhrase}：${poolText}${modifier ? ` ${modifier > 0 ? "+" : ""}${modifier}` : ""}＝${total}，${result}。`, result.includes("失败") ? "danger" : "roll");
    if (result.includes("逆止") && !selected.conditions.includes("逆止")) {
      updateCharacter(selected.id, { conditions: [...selected.conditions, "逆止"] });
    }
  };

  const rollEmotionTable = () => {
    const value = rollD6();
    const pair = EMOTION_PAIRS[value - 1];
    addLog(`[ET] 感情表：1D6=${value} → ${pair[0]}／${pair[1]}（双方各掷一次，正负自选）。`, "roll");
  };

  const rollTableHint = (command: string, tableName: string) => {
    addLog(`[${command}] ${tableName}出目：1D6=${rollD6()}——效果请对照规则书的${tableName}。`, "roll");
  };

  const declareNinpo = () => {
    if (!selected || !target) return;
    if (resolution && resolution.stage !== "完成") {
      addLog(`请先完成【${resolution.ninpoName}】的当前结算。`, "danger");
      return;
    }
    const distance = selected.plot == null || target.plot == null ? null : Math.abs(selected.plot - target.plot);
    const problems: string[] = [];
    if (distance != null && distance > selectedNinpo.range) problems.push(`距离 ${distance} 超过忍法距离 ${selectedNinpo.range}`);
    const nextCost = (selected.spentCost ?? 0) + selectedNinpo.cost;
    if (selected.plot != null && nextCost > selected.plot) problems.push(`累计花费 ${nextCost} 超过布局 ${selected.plot}`);
    if (selectedNinpo.kind === "支援" && (selected.usedNinpoIds ?? []).includes(selectedNinpo.id)) problems.push("同名支援忍法本回合已经使用");
    if (problems.length) {
      addLog(`${selected.name} 无法对 ${target.name} 使用【${selectedNinpo.name}】：${problems.join("；")}。`, "danger");
      return;
    }
    checkpoint();
    if (selectedNinpo.skill !== "自由") setTargetSkill(selectedNinpo.skill);
    updateCharacter(selected.id, {
      spentCost: nextCost,
      usedNinpoIds: selectedNinpo.kind === "支援" ? [...(selected.usedNinpoIds ?? []), selectedNinpo.id] : selected.usedNinpoIds,
    });
    setResolution({
      id: uid("resolution"),
      actorId: selected.id,
      targetId: target.id,
      ninpoId: selectedNinpo.id,
      ninpoName: selectedNinpo.name,
      ninpoKind: selectedNinpo.kind,
      skill: selectedNinpo.skill,
      stage: "命中判定",
    });
    addLog(`${selected.name} 对 ${target.name} 宣言【${selectedNinpo.name}】${distance == null ? "" : `（距离 ${distance}）`}。${selectedNinpo.damage ? `命中：${selectedNinpo.damage}。` : ""}`, "action");
  };

  const beginDefense = () => {
    if (!resolution || resolution.stage !== "反应窗口" || resolution.ninpoKind !== "攻击" || !resolutionTarget) return;
    checkpoint();
    setResolution({ ...resolution, stage: "回避判定" });
    setSelectedId(resolutionTarget.id);
    if (resolution.skill !== "自由") setTargetSkill(resolution.skill);
    setModifier(0);
    setLastRoll(null);
    addLog(`宣言窗口关闭，轮到 ${resolutionTarget.name} 进行回避判定。`, "system");
  };

  const skipDefense = () => {
    if (!resolution || resolution.stage !== "反应窗口") return;
    checkpoint();
    setResolution({ ...resolution, stage: "效果结算" });
    addLog(`同一时机的宣言窗口关闭，进入【${resolution.ninpoName}】效果结算。`, "system");
  };

  const confirmResolutionEffects = () => {
    if (!resolution || resolution.stage !== "效果结算") return;
    checkpoint();
    setResolution({ ...resolution, stage: "完成" });
    addLog(`【${resolution.ninpoName}】的伤害、变调与附带效果已确认。`, "action");
  };

  const dismissResolution = () => {
    if (!resolution) return;
    checkpoint();
    addLog(
      resolution.stage === "完成" ? `【${resolution.ninpoName}】结算已归档。` : `GM 跳过了【${resolution.ninpoName}】剩余结算。`,
      resolution.stage === "完成" ? "system" : "danger",
    );
    setResolution(null);
  };

  const toggleCondition = (condition: string) => {
    if (!selected) return;
    checkpoint();
    const conditions = selected.conditions.includes(condition) ? selected.conditions.filter((item) => item !== condition) : [...selected.conditions, condition];
    updateCharacter(selected.id, { conditions });
    addLog(`${selected.name} ${conditions.includes(condition) ? "获得" : "解除"}变调／状态：${condition}。`, conditions.includes(condition) ? "danger" : "action");
  };

  const toggleActive = () => {
    if (!selected) return;
    checkpoint();
    const active = !selected.active;
    updateCharacter(selected.id, { active, plot: active ? selected.plot : null });
    addLog(`${selected.name} 已标记为${active ? "重新参战" : "脱落／退场"}。`, active ? "action" : "danger");
  };

  const updateTool = (tool: keyof Character["tools"], delta: number) => {
    if (!selected) return;
    checkpoint();
    updateCharacter(selected.id, { tools: { ...selected.tools, [tool]: Math.max(0, selected.tools[tool] + delta) } });
  };

  const changePhase = (next: Phase) => {
    if (next === phase) return;
    checkpoint();
    setPhase(next);
    addLog(`团务阶段切换为「${next}阶段」。`, "system");
  };

  const toggleNinpo = (ninpoId: string) => {
    if (!selected) return;
    if (ninpoId === "close" && selected.ninpoIds.includes("close")) {
      addLog("接近战攻击是基础忍法，不占槽位且不能移除。", "danger");
      return;
    }
    if (selected.ninpoIds.includes(ninpoId) && selected.ninpoIds.length === 1) {
      addLog("角色至少需要保留一个可用忍法。", "danger");
      return;
    }
    checkpoint();
    const ninpoIds = selected.ninpoIds.includes(ninpoId)
      ? selected.ninpoIds.filter((id) => id !== ninpoId)
      : [...selected.ninpoIds, ninpoId];
    updateCharacter(selected.id, { ninpoIds });
  };

  const addCustomNinpo = () => {
    const name = customName.trim();
    if (!name || !selected) return;
    checkpoint();
    const ninpo: Ninpo = {
      id: uid("ninpo"),
      name,
      kind: customKind,
      skill: customSkill,
      range: customRange,
      cost: customCost,
      summary: customSummary.trim() || "玩家自定义忍法；具体效果由 GM 裁定。",
      note: customNote.trim() || undefined,
    };
    setCustomNinpo((items) => [...items, ninpo]);
    updateCharacter(selected.id, { ninpoIds: [...selected.ninpoIds, ninpo.id] });
    setCustomName("");
    setCustomSummary("");
    setCustomNote("");
    addLog(`${selected.name} 配置了自定义忍法【${name}】。`, "system");
  };

  const deleteCustomNinpo = (ninpoId: string) => {
    checkpoint();
    setCustomNinpo((items) => items.filter((ninpo) => ninpo.id !== ninpoId));
    setCharacters((items) => items.map((character) => ({
      ...character,
      ninpoIds: character.ninpoIds.filter((id) => id !== ninpoId),
    })));
  };

  const exportSave = () => {
    const blob = new Blob([JSON.stringify(currentState(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `忍神控制台-第${round}回合.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    addLog("已导出当前团务存档。", "system");
  };

  const importSave = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = normalizeGameState(JSON.parse(String(reader.result)));
        if (!parsed) throw new Error("invalid");
        checkpoint();
        setCharacters(parsed.characters);
        setSelectedId(parsed.selectedId);
        setRound(parsed.round);
        setRevealed(parsed.revealed);
        setLogs([...parsed.logs.slice(-499), { id: uid("log"), round: parsed.round, cycle: parsed.cycle, tone: "system", text: `已导入存档：${file.name}` }]);
        setPhase(parsed.phase);
        setTurnIndex(parsed.turnIndex);
        setCustomNinpo(parsed.customNinpo);
        setCycle(parsed.cycle);
        setSceneNumber(parsed.sceneNumber);
        setSceneOwnerId(parsed.sceneOwnerId);
        setSceneParticipantIds(parsed.sceneParticipantIds);
        setSceneAction(parsed.sceneAction);
        setSceneNote(parsed.sceneNote);
        setEmotions(parsed.emotions);
        setIntel(parsed.intel);
        setCues(parsed.cues);
        setTrackers(parsed.trackers);
        setTreasures(parsed.treasures);
        setBrief(parsed.brief);
        setHandouts(parsed.handouts);
        setResolution(parsed.resolution);
        setTutorial(parsed.tutorial);
        setTranscript(parsed.transcript);
        setReplay(parsed.replay);
        setGmBeat("定调");
        setGmPressure(1);
      } catch {
        addLog("存档无法读取，请确认文件来自本控制台。", "danger");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const startTutorial = (next: TutorialState) => {
    checkpoint();
    const tutorialCharacters = RAIN_ZERO_LINE.characters.map(({ character }) => JSON.parse(JSON.stringify(character)) as Character);
    const hero = tutorialCharacters.find((character) => character.id === RAIN_ZERO_LINE.setup.heroId) ?? tutorialCharacters[0];
    const enemy = tutorialCharacters.find((character) => character.id === RAIN_ZERO_LINE.setup.enemyId) ?? tutorialCharacters[1];
    const tutorialBrief: SessionBrief = {
      title: RAIN_ZERO_LINE.meta.title,
      regulation: "现代篇",
      scenarioType: "协力型（原创单人教学变体）",
      playerCount: 1,
      cycles: RAIN_ZERO_LINE.meta.cycles,
      rank: "中忍",
      characterMode: "新卡",
      gmDifficulty: "系统引导",
      allowedRules: "基本规则概念；不使用背景、下位流派或扩展规则",
      submissionDeadline: "",
      requirements: { requiredSkills: 6, requiredNinpoSlots: 3, requiredTools: 3 },
    };
    const tutorialHandouts = makeDefaultHandouts(tutorialCharacters, 1).map((handout) => ({
      ...handout,
      assignedCharacterId: hero.id,
      publicMission: hero.mission,
      privateSecret: hero.secret,
      recommendedFaction: hero.faction,
      delivered: true,
      reviewed: true,
      questionsResolved: true,
    }));
    setCharacters(tutorialCharacters);
    setSelectedId(hero.id);
    setTargetId(enemy.id);
    setRound(1);
    setRevealed(false);
    setPhase("导入");
    setTurnIndex(0);
    setCustomNinpo([]);
    setCycle(1);
    setSceneNumber(1);
    setSceneOwnerId(hero.id);
    setSceneParticipantIds([hero.id]);
    setSceneAction("未定");
    setSceneNote("");
    setEmotions([]);
    setIntel([]);
    setCues([
      { id: "rain-zero-cue-roof", title: "无面车掌带着白狐匣登上车顶", cycle: 2, scene: 2, done: false },
      { id: "rain-zero-cue-ending", title: "公开白狐匣的最后真相", cycle: 2, scene: 3, done: false },
    ]);
    setTrackers([{ id: "rain-zero-terminal", name: "距离终点", value: 0, max: 3 }]);
    setTreasures([]);
    setBrief(tutorialBrief);
    setHandouts(tutorialHandouts);
    setResolution(null);
    setTutorial(next);
    setTranscript(null);
    setReplay(null);
    setTableSafe(false);
    setGmBeat("定调");
    setGmPressure(1);
    setLogs([{ id: uid("log"), round: 1, cycle: 1, tone: "system", text: "原创教学忍务《雨夜零号线》已载入。系统将扮演主持人与 NPC。" }]);
    setView("tutorial");
    setLastRoll(null);
  };

  const changeTutorial = (next: TutorialState, eventText?: string) => {
    setTutorial(next);
    const nextStep = getTutorialStep(next);
    if (nextStep?.phase === "导入" || nextStep?.phase === "主要" || nextStep?.phase === "高潮") setPhase(nextStep.phase);
    if (nextStep?.id.startsWith("cycle-2")) setCycle(2);
    if (nextStep?.id === "climax-battle") setRevealed(true);
    if (eventText) addLog(eventText, eventText.includes("失败") || eventText.includes("暂停") ? "danger" : "action");
  };

  const clearSession = () => {
    checkpoint();
    const fresh = createInitialGameState();
    setCharacters(fresh.characters);
    setSelectedId(fresh.selectedId);
    setTargetId(fresh.characters.find((character) => character.id !== fresh.selectedId)?.id ?? fresh.selectedId);
    setRound(fresh.round);
    setRevealed(fresh.revealed);
    setPhase(fresh.phase);
    setTurnIndex(fresh.turnIndex);
    setCustomNinpo(fresh.customNinpo);
    setCycle(fresh.cycle);
    setSceneNumber(fresh.sceneNumber);
    setSceneOwnerId(fresh.sceneOwnerId);
    setSceneParticipantIds(fresh.sceneParticipantIds);
    setSceneAction(fresh.sceneAction);
    setSceneNote(fresh.sceneNote);
    setEmotions(fresh.emotions);
    setIntel(fresh.intel);
    setCues(fresh.cues);
    setTrackers(fresh.trackers);
    setTreasures(fresh.treasures);
    setTreasureName("");
    setTreasureNote("");
    setTreasureTargets({});
    setBrief(fresh.brief);
    setHandouts(fresh.handouts);
    setResolution(fresh.resolution);
    setTutorial(fresh.tutorial);
    setTranscript(fresh.transcript);
    setReplay(fresh.replay);
    setReplayMode("戏剧节拍");
    setReplayGenre("都市悬疑");
    setReplayLength("标准");
    setReplayEnding("苦涩胜利");
    setReplayIntensity(2);
    setReplaySeed("tsuioku-01");
    setReplayHeroId(fresh.characters.find((character) => character.role === "PC")?.id ?? fresh.selectedId);
    setReplayRevealSecrets(false);
    setInteropPrivate(false);
    setGmBeat("定调");
    setGmPressure(1);
    setTranscriptDraft("");
    setTranscriptQuery("");
    setTranscriptSpeaker("");
    setTranscriptSceneId("all");
    setLogs(fresh.logs);
    setView("tutorial");
    setLastRoll(null);
  };

  if (!selected) return null;

  return (
    <main className="console-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">忍</span>
          <div><p className="eyebrow">SHINOBIGAMI · SESSION CONSOLE</p><h1>忍神控制台</h1></div>
          <span className="version">MVP 1.5</span>
        </div>
        <div className="top-actions">
          <div className="round-badge"><span>ROUND</span><strong>{String(round).padStart(2, "0")}</strong></div>
          <button className="ghost-button" onClick={undo} disabled={!history.length}>↶ 撤销</button>
          <button className="ghost-button" onClick={newRound}>新回合</button>
          <button className="primary-button" onClick={advanceTurn} disabled={!revealed}>下一位 →</button>
        </div>
      </header>

      <nav className="mode-tabs" aria-label="主要视图">
        <button className={view === "tutorial" ? "active first-mission-tab" : "first-mission-tab"} onClick={() => setView("tutorial")}>第一次忍务</button>
        <button className={view === "prep" ? "active" : ""} onClick={() => setView("prep")}>开团准备</button>
        <button className={view === "replay" ? "active replay-tab" : "replay-tab"} onClick={() => setView("replay")}>Replay 工房</button>
        <button className={view === "battle" ? "active" : ""} onClick={() => setView("battle")}>战斗控制台</button>
        <button className={view === "director" ? "active" : ""} onClick={() => setView("director")}>场景导演</button>
        <button className={view === "sheet" ? "active" : ""} onClick={() => setView("sheet")}>角色工作台</button>
        <div className="phase-tabs" aria-label="团务阶段">
          {(["导入", "主要", "高潮"] as Phase[]).map((item) => <button key={item} className={phase === item ? "active" : ""} onClick={() => changePhase(item)}>{item}</button>)}
        </div>
        <div className="save-actions">
          <button className={tableSafe ? "safe-active" : ""} onClick={() => setTableSafe((value) => !value)}>{tableSafe ? "桌面安全" : "GM 视图"}</button>
          <button onClick={exportSave}>导出存档</button><button onClick={() => importRef.current?.click()}>导入</button>
          <input ref={importRef} type="file" accept="application/json" onChange={importSave} hidden />
        </div>
      </nav>

      <div className={`workspace ${view === "tutorial" ? "tutorial-workspace" : ""}`}>
        {view !== "tutorial" && <aside className="character-rail panel">
          <div className="panel-heading"><div><span>CHARACTERS</span><h2>登场角色</h2></div><span className="counter">{characters.length}</span></div>
          <div className="character-list">
            {characters.map((character) => {
              const remaining = FIELD_NAMES.filter((field) => character.life[field]).length + character.extraLife;
              return (
                <button key={character.id} className={`character-card ${selected.id === character.id ? "selected" : ""} ${currentActor?.id === character.id && revealed ? "current-turn" : ""} ${character.active ? "" : "inactive"}`} onClick={() => setSelectedId(character.id)}>
                  <span className={`role-chip ${character.role.toLowerCase()}`}>{character.role}</span>
                  <span className="character-name">{character.name}</span>
                  <span className="character-meta">{character.faction} · {character.rank}{!character.active ? " · 已脱落" : phase === "主要" ? ` · ${character.acted ? "已行动" : "未行动"}` : ""}</span>
                  <span className="life-dots" aria-label={`剩余生命力 ${remaining}`}>{FIELD_NAMES.map((field) => <i key={field} className={character.life[field] ? "alive" : "lost"} />)}</span>
                  <span className={`plot-token ${revealed ? "revealed" : ""}`}>{character.plot == null ? "–" : revealed ? character.plot : "?"}</span>
                </button>
              );
            })}
          </div>
          <div className="rail-actions"><button onClick={() => addCharacter("PC")}>＋ PC</button><button onClick={() => addCharacter("NPC")}>＋ NPC</button></div>
          <button className="danger-link" onClick={removeSelected} disabled={characters.length <= 1}>移除当前角色</button>
        </aside>}

        <section className="main-stage">
          {view === "tutorial" ? (
            <TutorialRunner
              state={tutorial}
              tableSafe={tableSafe}
              onChange={changeTutorial}
              onStart={startTutorial}
              onToggleTableSafe={() => setTableSafe((value) => !value)}
              onOpenConsole={(nextView) => setView(nextView)}
            />
          ) : view === "prep" ? (
            <>
              <section className="panel prep-brief-panel">
                <div className="panel-heading battle-heading">
                  <div><span>SESSION PRE-FLIGHT</span><h2>开团公告与约束</h2></div>
                  <span className="selection-count">{prepBlockers.length ? `${prepBlockers.length} 项阻塞` : "可以开团"}</span>
                </div>
                <div className="source-audit">
                  <strong>本地资料体检</strong>
                  <p>本工具不读取、不上传本机的规则书、字幕或其他本地文件；所有导入内容只在当前浏览器内解析，团务数据默认只存在本地存档中。</p>
                </div>
                <div className="brief-grid">
                  <label className="brief-title">忍务名称<input value={brief.title} onChange={(event) => updateBrief({ title: event.target.value })} /></label>
                  <label>规制<input value={brief.regulation} onChange={(event) => updateBrief({ regulation: event.target.value })} /></label>
                  <label>剧本类型<input value={brief.scenarioType} onChange={(event) => updateBrief({ scenarioType: event.target.value })} /></label>
                  <label>玩家人数<input type="number" min="1" max="12" value={brief.playerCount} onChange={(event) => updateBrief({ playerCount: Math.max(1, Number(event.target.value) || 1) })} /></label>
                  <label>巡数<input type="number" min="1" max="20" value={brief.cycles} onChange={(event) => updateBrief({ cycles: Math.max(1, Number(event.target.value) || 1) })} /></label>
                  <label>阶级<input value={brief.rank} onChange={(event) => updateBrief({ rank: event.target.value })} /></label>
                  <label>角色卡<select value={brief.characterMode} onChange={(event) => updateBrief({ characterMode: event.target.value as SessionBrief["characterMode"] })}><option>新卡</option><option>续卡</option><option>混合</option></select></label>
                  <label>GM 难度<input value={brief.gmDifficulty} onChange={(event) => updateBrief({ gmDifficulty: event.target.value })} /></label>
                  <label>交卡期限<input type="datetime-local" value={brief.submissionDeadline} onChange={(event) => updateBrief({ submissionDeadline: event.target.value })} /></label>
                  <label className="brief-rules">允许规则与扩展<textarea value={brief.allowedRules} onChange={(event) => updateBrief({ allowedRules: event.target.value })} placeholder="记录本团可用的扩展、下位流派或特殊规则；不要粘贴规则书原文。" /></label>
                </div>
                <div className="quota-strip">
                  <span>角色卡检查值</span>
                  <label>特技<input type="number" min="0" max="30" value={brief.requirements.requiredSkills} onChange={(event) => updateRequirements({ requiredSkills: Number(event.target.value) })} /></label>
                  <label>忍法槽<input type="number" min="0" max="30" value={brief.requirements.requiredNinpoSlots} onChange={(event) => updateRequirements({ requiredNinpoSlots: Number(event.target.value) })} /></label>
                  <label>忍具<input type="number" min="0" max="30" value={brief.requirements.requiredTools} onChange={(event) => updateRequirements({ requiredTools: Number(event.target.value) })} /></label>
                  <button onClick={resizeHandouts}>按人数整理 PC 位</button>
                  <em>接近战攻击为基础忍法，不计入忍法槽；扩展规则可直接调整检查值。</em>
                </div>
              </section>

              <section className="panel handout-panel">
                <div className="panel-heading battle-heading"><div><span>PRIVATE HANDOUTS</span><h2>PC 分配与秘密交付</h2></div><span className="selection-count">{handouts.length} 份</span></div>
                <div className="handout-list">
                  {handouts.map((handout) => {
                    const assigned = characters.find((character) => character.id === handout.assignedCharacterId);
                    return <article key={handout.id} className="handout-card">
                      <div className="handout-head"><strong>{handout.slot}</strong><span>{assigned?.name ?? "未分配"}</span></div>
                      <div className="handout-fields">
                        <label>分配角色<select value={handout.assignedCharacterId} onChange={(event) => updateHandout(handout.id, { assignedCharacterId: event.target.value, delivered: false, reviewed: false, questionsResolved: false })}><option value="">尚未分配</option>{characters.filter((character) => character.role === "PC").map((character) => <option key={character.id} value={character.id}>{character.name} · {character.faction}</option>)}</select></label>
                        <label>推荐流派<input value={handout.recommendedFaction} onChange={(event) => updateHandout(handout.id, { recommendedFaction: event.target.value, reviewed: false })} placeholder="不限或指定流派" /></label>
                        <label>公开使命<textarea value={handout.publicMission} onChange={(event) => updateHandout(handout.id, { publicMission: event.target.value, reviewed: false })} /></label>
                        <label className={tableSafe ? "masked-field" : ""}>私人秘密<textarea value={tableSafe ? "桌面安全模式：秘密已隐藏" : handout.privateSecret} disabled={tableSafe} onChange={(event) => updateHandout(handout.id, { privateSecret: event.target.value, delivered: false, questionsResolved: false })} /></label>
                      </div>
                      <div className="handout-actions">
                        <button className={handout.delivered ? "done" : ""} onClick={() => { checkpoint(); updateHandout(handout.id, { delivered: !handout.delivered }); }}>{handout.delivered ? "✓ 秘密已送达" : "确认秘密送达"}</button>
                        <button className={handout.questionsResolved ? "done" : ""} onClick={() => { checkpoint(); updateHandout(handout.id, { questionsResolved: !handout.questionsResolved }); }}>{handout.questionsResolved ? "✓ 问题已答复" : "确认私聊答复"}</button>
                        <button className={handout.reviewed ? "done" : ""} onClick={() => { checkpoint(); updateHandout(handout.id, { reviewed: !handout.reviewed }); }}>{handout.reviewed ? "✓ GM 已复核" : "确认角色卡复核"}</button>
                        <button onClick={() => applyHandoutToCharacter(handout)}>同步到角色卡</button>
                      </div>
                    </article>;
                  })}
                </div>
              </section>

              <section className="panel readiness-panel">
                <div className="readiness-score"><span>READY CHECK</span><strong>{prepBlockers.length ? "未通过" : "通过"}</strong><p>{prepBlockers.length} 项阻塞 · {prepWarnings.length} 项提醒</p></div>
                <div className="readiness-issues">
                  {preflightIssues.length ? preflightIssues.map((issue, index) => <article className={issue.level} key={`${issue.code}-${issue.characterId ?? issue.handoutId ?? index}`}><span>{issue.level === "blocker" ? "!" : "·"}</span><p>{issue.message}</p></article>) : <article className="ready"><span>✓</span><p>公告、秘密交付、私聊确认与角色卡复核均已完成。</p></article>}
                </div>
                <div className="readiness-launch"><p>数量提醒允许 GM 按扩展规则确认后继续；秘密、分配与复核缺失会阻止误开团。</p><button onClick={startSession} disabled={Boolean(prepBlockers.length)}>完成检查，进入主要阶段 →</button></div>
              </section>
            </>
          ) : view === "replay" ? (
            <div className="replay-workshop">
              <section className="panel replay-forge-panel">
                <div className="panel-heading battle-heading">
                  <div><span>AUTOMATIC REPLAY FORGE</span><h2>自动 Replay 工房</h2></div>
                  <span className="selection-count">本地生成 · 可复现</span>
                </div>
                <div className="replay-hero">
                  <div>
                    <span>DRAMATIC ARC</span>
                    <h3>把当前团务锻造成一条有呼吸的故事线</h3>
                    <p>引子建立悬念，调查累积压力，中段故意回落，再用秘密反转推向高潮。相同种子与设置会生成相同正文，方便 GM 复盘与改稿。</p>
                  </div>
                  <div className="replay-arc-mini" aria-label="示例张力曲线">
                    {[18, 35, 58, 43, 72, 89, 77, 100, 34].map((value, index) => <i key={index} style={{ height: `${value}%` }} />)}
                  </div>
                </div>
                <div className="replay-config-grid">
                  <label>生成模式<select value={replayMode} onChange={(event) => setReplayMode(event.target.value as ReplayMode)}>{(["戏剧节拍", "实战巡回"] as ReplayMode[]).map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label>主角<select value={replayHeroId} onChange={(event) => setReplayHeroId(event.target.value)}>{characters.filter((character) => character.role === "PC").map((character) => <option key={character.id} value={character.id}>{character.name} · {character.faction}</option>)}</select></label>
                  <label>故事类型<select value={replayGenre} onChange={(event) => setReplayGenre(event.target.value as ReplayGenre)}>{(["都市悬疑", "学园怪谈", "黑色谍战", "热血决战"] as ReplayGenre[]).map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label>篇幅<select value={replayLength} onChange={(event) => setReplayLength(event.target.value as ReplayLength)}>{(["短篇", "标准", "长篇"] as ReplayLength[]).map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label>结局<select value={replayEnding} onChange={(event) => setReplayEnding(event.target.value as ReplayEnding)}>{(["苦涩胜利", "破晓逆转", "开放悬念", "任务失败"] as ReplayEnding[]).map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="replay-seed">固定种子<input value={replaySeed} onChange={(event) => setReplaySeed(event.target.value)} placeholder="例如 tsuioku-01" /></label>
                  <div className="replay-intensity"><span>戏剧强度</span><div>{([1, 2, 3] as const).map((level) => <button key={level} className={replayIntensity === level ? "active" : ""} onClick={() => setReplayIntensity(level)}>{level === 1 ? "克制" : level === 2 ? "起伏" : "激烈"}</button>)}</div></div>
                </div>
                <div className="replay-secret-row">
                  <label className={tableSafe ? "disabled" : ""}><input type="checkbox" checked={replayRevealSecrets && !tableSafe} disabled={tableSafe} onChange={(event) => setReplayRevealSecrets(event.target.checked)} />允许草稿引用角色秘密</label>
                  <span>{tableSafe ? "桌面安全模式已锁定：不会写入秘密。" : "关闭时只生成秘密发生了作用的占位叙事。"}</span>
                  <button className="replay-generate" onClick={() => createReplay()}>生成跌宕 Replay →</button>
                </div>
              </section>

              {replay ? <>
                <section className="panel replay-curve-panel">
                  <div className="replay-result-heading">
                    <div><span>TENSION MAP</span><h2>张力曲线</h2><p>低谷不是断线：假胜利让观众喘息，随后用反转抬高风险。</p></div>
                    <div className="replay-stats"><span><b>{replay.stats.sceneCount}</b> 幕</span>{replay.stats.cycleCount ? <span><b>{replay.stats.cycleCount}</b> 循环</span> : null}<span><b>{replay.stats.lineCount}</b> 行</span><span><b>{replay.stats.rollCount}</b> 次判定</span><span><b>{replay.stats.peakTension}</b> 峰值</span></div>
                  </div>
                  <div className="replay-curve" aria-label="Replay 张力曲线">
                    {replay.scenes.map((scene) => <div key={scene.id} className={scene.beat === "高潮" ? "peak" : ""}><b>{scene.tension}</b><i style={{ height: `${scene.tension}%` }} /><span>{scene.sceneType ?? scene.beat}</span></div>)}
                  </div>
                  <div className="replay-result-actions"><button onClick={rerollReplay}>换种子重演</button><button onClick={exportReplay}>导出 TXT</button><button className="send-replay" onClick={sendReplayToDesk}>送入跑团记录台 →</button></div>
                </section>

                <section className="replay-scenes" aria-label="自动生成的 Replay 场景">
                  {replay.scenes.map((scene) => <article className={`panel replay-scene-card beat-${scene.beat}`} key={scene.id}>
                    <header><span>{scene.sceneType ? (scene.cycle ? `第${scene.cycle}循环 · ${scene.sceneType}场景` : `${scene.sceneType}场景`) : `${scene.phase} · ${scene.beat}`}</span><h3>{String(scene.index).padStart(2, "0")} / {scene.title}</h3><div><b>{scene.tension}</b><small>TENSION</small></div></header>
                    <div className="replay-lines">{scene.lines.map((line) => <p className={line.kind} key={line.id}><strong>{line.speaker}</strong><span>{tableSafe && line.kind === "reveal" ? "桌面安全模式：秘密揭示已隐藏。" : line.text}</span></p>)}</div>
                  </article>)}
                </section>
                <p className="replay-disclaimer">自动判定只服务于戏剧化草稿，不替代实团掷骰、规则效果或 GM 裁定。生成与导出均在当前设备完成。</p>
              </> : <section className="panel replay-empty"><span>01</span><div><strong>先选择主角与故事方向</strong><p>生成器会读取角色名、流派、使命、信念、特技、忍法与奥义；只有主动允许时才会引用秘密。</p></div><span>09</span></section>}
            </div>
          ) : view === "battle" ? (
            <>
              <section className="panel plot-panel">
                <div className="panel-heading battle-heading">
                  <div><span>SECRET PLOT</span><h2>布局阶段</h2></div>
                  <button className="reveal-button" onClick={revealPlots} disabled={!characters.some((c) => c.plot != null)}>{revealed ? "已公开" : "公开全部布局"}</button>
                </div>
                <div className="plot-lanes">
                  {characters.filter((c) => c.active).map((character) => (
                    <div className="plot-row" key={character.id}>
                      <button className="plot-character" onClick={() => setSelectedId(character.id)}>{character.name}</button>
                      <div className="plot-options" aria-label={`${character.name} 的布局`}>
                        {[1, 2, 3, 4, 5, 6].map((plot) => <button key={plot} className={character.plot === plot ? "chosen" : ""} onClick={() => setPlot(character, plot)} aria-label={`${character.name} 选择布局 ${plot}`}>{character.plot === plot && !revealed ? "◆" : plot}</button>)}
                      </div>
                      <span className="risk-label">攻击处理大失败 ≤ {character.plot ?? 2}</span>
                    </div>
                  ))}
                </div>
                {revealed && <div className="initiative-strip"><span>行动顺序</span>{battleOrder.map((character, index) => <button className={turnIndex % battleOrder.length === index ? "current" : ""} key={character.id} onClick={() => { setSelectedId(character.id); setTurnIndex(index); }}><b>{index + 1}</b>{character.name}<em>{character.plot}</em></button>)}</div>}
              </section>

              <div className="battle-grid">
                <section className="panel action-panel">
                  <div className="panel-heading"><div><span>ACTION</span><h2>忍法宣言</h2></div></div>
                  <div className="actor-banner"><span>行动者</span><strong>{selected.name}</strong><small>布局 {selected.plot ?? "未定"} · 花费 {selected.spentCost ?? 0}/{selected.plot ?? "–"}</small></div>
                  <label className="field-label">使用忍法<select value={activeNinpoId} onChange={(event) => setSelectedNinpoId(event.target.value)}>{learnedNinpo.map((ninpo) => <option value={ninpo.id} key={ninpo.id}>{ninpo.name}</option>)}</select></label>
                  <div className="ninpo-card"><div className="ninpo-stats"><span>{selectedNinpo.kind}</span><span>距离 {selectedNinpo.range}</span><span>花费 {selectedNinpo.cost}</span><span>{selectedNinpo.skill}</span></div><p>{selectedNinpo.summary}</p>{selectedNinpo.damage && <strong>{selectedNinpo.damage}</strong>}</div>
                  <label className="field-label">目标<select value={target?.id ?? ""} onChange={(event) => setTargetId(event.target.value)}>{characters.filter((character) => character.id !== selected.id && character.active).map((character) => <option value={character.id} key={character.id}>{character.name} · 布局 {character.plot ?? "?"}</option>)}</select></label>
                  <button className="declare-button" onClick={declareNinpo} disabled={!target}>宣言忍法</button>
                </section>

                <section className="panel check-panel">
                  <div className="panel-heading"><div><span>2D6 CHECK</span><h2>行为判定</h2></div></div>
                  <div className="check-target">
                    <label>指定特技<select value={targetSkill} onChange={(event) => setTargetSkill(event.target.value)}>{FIELD_NAMES.map((field) => <optgroup label={field} key={field}>{SKILL_TABLE[field].map((skill) => <option value={skill} key={skill}>{skill}</option>)}</optgroup>)}</select></label>
                    <div className="target-number"><span>目标值</span><strong>{check.target}</strong></div>
                  </div>
                  <label className="field-label">使用特技
                    <select value={availableSkills.includes(substituteSkillChoice) ? substituteSkillChoice : "auto"} onChange={(event) => setSubstituteSkillChoice(event.target.value)}>
                      <option value="auto">自动选择最近：{automaticCheck.skill}</option>
                      {availableSkills.map((skill) => <option value={skill} key={skill}>{skill}{skill === automaticCheck.skill ? "（最近）" : "（主动远距代用）"}</option>)}
                    </select>
                  </label>
                  <p className="substitution">本次使用：<b>{check.skill}</b> <span>距离 {check.distance}</span>{check.criticalOnly && <em>无可用特技：仅大成功可成功</em>}</p>
                  <div className="odds-panel">
                    <div><span>成功率</span><strong>{(odds.success * 100).toFixed(1)}%</strong></div>
                    <div className="odds-bar"><i className="fumble" style={{ width: `${odds.fumble * 100}%` }} /><i className="success" style={{ width: `${odds.success * 100}%` }} /></div>
                    <p>大成功 {(odds.critical * 100).toFixed(1)}% · 大失败 {(odds.fumble * 100).toFixed(1)}% · 按当前骰池、修正与大失败值精确枚举</p>
                  </div>
                  <div className="dice-pool-control"><span>骰池</span>{[2, 3, 4, 5, 6].map((count) => <button key={count} className={diceCount === count ? "active" : ""} onClick={() => setDiceCount(count)}>{count}D</button>)}<em>多骰取高 2</em></div>
                  <div className="modifier-control"><button onClick={() => setModifier((value) => value - 1)}>−</button><span>修正 <strong>{modifier > 0 ? `+${modifier}` : modifier}</strong></span><button onClick={() => setModifier((value) => value + 1)}>＋</button></div>
                  <button className="roll-button" onClick={rollCheck}><span>{diceCount > 2 ? `${diceCount}SG` : "2SG"} · BCDICE STYLE</span>投掷判定</button>
                  {lastRoll && <div className={`roll-result ${lastRoll.result.includes("失败") ? "failed" : "passed"}`}><span>{lastRoll.dice.join(" · ")}{lastRoll.dice.length > 2 ? ` → ${lastRoll.kept.join("+")}` : ""}</span><strong>{lastRoll.total}</strong><em>{lastRoll.result}</em></div>}
                  <div className="dice-pool-control quick-tables"><span>快速表骰</span><button onClick={rollEmotionTable}>ET 感情表</button><button onClick={() => rollTableHint("FT", "大失败表")}>FT 出目</button><button onClick={() => rollTableHint("WT", "变调表")}>WT 出目</button><button onClick={() => addLog(`[1D6] 素点：${rollD6()}。`, "roll")}>1D6</button><em>ET 给出感情对；FT／WT 只给出目，效果请对照规则书</em></div>
                </section>
              </div>

              <section className={`panel resolution-panel ${resolution ? "active" : "idle"}`}>
                <div className="panel-heading battle-heading">
                  <div><span>ACTION PIPELINE</span><h2>当前结算流程</h2></div>
                  <span className="selection-count">{resolution?.stage ?? "等待宣言"}</span>
                </div>
                {resolution ? <>
                  <div className="resolution-summary">
                    <div><span>行动者</span><strong>{resolutionActor?.name ?? "?"}</strong></div>
                    <b>【{resolution.ninpoName}】</b>
                    <div><span>目标</span><strong>{resolutionTarget?.name ?? "?"}</strong></div>
                  </div>
                  <div className="resolution-steps">
                    {(["命中判定", "反应窗口", "回避判定", "效果结算", "完成"] as const).map((stage, index, stages) => {
                      const currentIndex = stages.indexOf(resolution.stage);
                      return <span key={stage} className={index < currentIndex ? "done" : index === currentIndex ? "current" : ""}><i>{index < currentIndex ? "✓" : index + 1}</i>{stage}</span>;
                    })}
                  </div>
                  <div className="resolution-instruction">
                    {resolution.stage === "命中判定" && <p>使用右侧行为判定完成命中判定；失败会直接结束，成功后先停在宣言窗口。</p>}
                    {resolution.stage === "反应窗口" && <p>先询问是否还有同一时机的忍法、奥义或修正宣言；确认无人继续宣言后，再进入回避或直接适用效果。</p>}
                    {resolution.stage === "回避判定" && <p>当前已切换到 {resolutionTarget?.name ?? "目标"}，使用【{resolution.skill}】完成回避判定；成功则结束，失败进入效果结算。</p>}
                    {resolution.stage === "效果结算" && <p>{samePlotBatch.length > 1 ? `布局 ${resolutionActor?.plot} 有 ${samePlotBatch.length} 人同速：先记录结果，待同速角色都完成攻击后再统一应用生命、逆止与变调。` : "使用下方生命力与变调按钮应用结果，再确认效果已结算。"}</p>}
                    {resolution.stage === "完成" && <p>本次忍法已完成。可以归档流程，或直接点击顶部“下一位”归档并推进行动顺序。</p>}
                  </div>
                  <div className="resolution-actions">
                    {resolution.stage === "反应窗口" && <>{resolution.ninpoKind === "攻击" && <button onClick={beginDefense}>宣言完毕，进入回避</button>}<button onClick={skipDefense}>{resolution.ninpoKind === "攻击" ? "目标不回避，进入效果" : "宣言完毕，进入效果"}</button></>}
                    {resolution.stage === "效果结算" && <button onClick={confirmResolutionEffects}>确认伤害与效果已处理</button>}
                    {resolution.stage === "完成" && <button onClick={dismissResolution}>归档本次结算</button>}
                    {resolution.stage !== "完成" && <button className="skip" onClick={dismissResolution}>GM 跳过剩余流程</button>}
                  </div>
                </> : <div className="resolution-empty"><strong>宣言忍法后自动启动</strong><p>控制台会依次锁定命中、同一时机宣言、回避、效果与完成状态；未完成前会阻止误点下一位或新回合。</p></div>}
              </section>

              <section className="panel treasure-panel">
                <div className="panel-heading battle-heading"><div><span>PRIZE</span><h2>秘宝</h2></div><span className="selection-count">{treasures.length ? `${treasures.length} 件` : "尚未登记"}</span></div>
                <div className="treasure-list">
                  {treasures.length ? treasures.map((treasure) => {
                    const holder = characters.find((character) => character.id === treasure.holderId);
                    const candidates = characters.filter((character) => character.id !== treasure.holderId);
                    const targetId = candidates.some((character) => character.id === treasureTargets[treasure.id]) ? treasureTargets[treasure.id] : candidates[0]?.id ?? "";
                    return <article key={treasure.id}>
                      <div className="treasure-info"><strong>〈{treasure.name}〉</strong><span>持有者：{holder?.name ?? "无人"}</span>{treasure.note && <em>{treasure.note}</em>}</div>
                      <div className="treasure-actions">
                        <label>让渡给<select aria-label={`秘宝 ${treasure.name} 的让渡目标`} value={targetId} onChange={(event) => setTreasureTargets((items) => ({ ...items, [treasure.id]: event.target.value }))}>{candidates.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select></label>
                        <button onClick={() => transferTreasure(treasure.id, targetId)} disabled={!targetId}>让渡</button>
                        <button className="remove-treasure" onClick={() => removeTreasure(treasure.id)}>删除</button>
                      </div>
                    </article>;
                  }) : <p className="empty-log">尚未登记秘宝。登记后可在战斗结算或剧情节点执行让渡，流向会写入团务记录。</p>}
                </div>
                <div className="treasure-form">
                  <input aria-label="秘宝名称" value={treasureName} onChange={(event) => setTreasureName(event.target.value)} placeholder="秘宝名称" />
                  <input aria-label="秘宝备注" value={treasureNote} onChange={(event) => setTreasureNote(event.target.value)} placeholder="备注：夺取条件或效果摘要（勿粘贴规则书原文）" />
                  <button onClick={addTreasure} disabled={!treasureName.trim()}>登记秘宝</button>
                </div>
              </section>
            </>
          ) : view === "director" ? (
            <>
              <section className="panel gm-cockpit">
                <div className="gm-cockpit-head">
                  <div>
                    <span>VETERAN GM CO-PILOT</span>
                    <h2>熟练 GM 导演席</h2>
                    <p>给画面、问玩家、讲清得失、让失败继续推动故事。</p>
                  </div>
                  <div className={`gm-tension tension-${gmBrief.tensionLabel}`} role="status" aria-label={`当前场景张力 ${gmBrief.tension}，${gmBrief.tensionLabel}`}>
                    <span>SCENE TENSION</span>
                    <strong>{gmBrief.tension}</strong>
                    <em>{gmBrief.tensionLabel}</em>
                    <i><b style={{ width: `${gmBrief.tension}%` }} /></i>
                  </div>
                </div>

                <div className="gm-diagnostics">
                  {gmBrief.diagnostics.map((item) => <article className={item.tone} key={item.label}><span>{item.label}</span><strong>{item.value}</strong></article>)}
                  <article className={dueCues.length ? "danger" : "good"}><span>主持事件</span><strong>{gmBrief.privateCue}</strong></article>
                </div>

                <div className="gm-beat-rail" aria-label="场景节拍">
                  {GM_BEATS.map((beat, index) => <button key={beat} aria-pressed={gmBeat === beat} className={gmBeat === beat ? "active" : GM_BEATS.indexOf(gmBeat) > index ? "done" : ""} onClick={() => setGmBeat(beat)}><i>{String(index + 1).padStart(2, "0")}</i><span>{beat}</span></button>)}
                </div>

                <div className="gm-cockpit-body">
                  <article className="gm-now-card">
                    <span>NOW / 现在做什么</span>
                    <h3>{gmBrief.headline}</h3>
                    <p>{gmBrief.objective}</p>
                    <div className="gm-spotlight">
                      <span>建议聚光灯</span>
                      <strong>{gmBrief.spotlight.name}</strong>
                      <p>{gmBrief.spotlight.reason}</p>
                      <button onClick={acceptGmSpotlight}>采用聚光灯建议</button>
                    </div>
                  </article>

                  <article className="gm-read-card">
                    <span>READ ALOUD / 可直接朗读</span>
                    <blockquote>{gmBrief.readAloud}</blockquote>
                    <div><button onClick={() => appendGmDirection("opening")}>加入开场</button><button onClick={() => appendGmDirection("question")}>加入提问</button></div>
                  </article>

                  <article className="gm-stakes-card">
                    <span>STAKES / 判定前公开</span>
                    <div className="success"><b>成功</b><p>{gmBrief.success}</p></div>
                    <div className="failure"><b>失败</b><p>{gmBrief.failure}</p></div>
                    <div className="complication"><b>建议剧情代价</b><p>{gmBrief.complication}</p></div>
                  </article>
                </div>

                <div className="gm-command-bar">
                  <div className="gm-pressure-control">
                    <span>环境压力 · {gmBrief.pressureLabel}</span>
                    <button aria-label="降低环境压力" onClick={() => setGmPressure((value) => Math.max(0, value - 1) as GmPressure)}>−</button>
                    <strong>{gmPressure}</strong>
                    <button aria-label="提高环境压力" onClick={() => setGmPressure((value) => Math.min(3, value + 1) as GmPressure)}>＋</button>
                  </div>
                  <p>{gmBrief.nextStep}</p>
                  {sceneAction === "未定" && <button className="gm-action-suggest" onClick={acceptSuggestedAction}>建议：{gmBrief.suggestedAction}</button>}
                  <button className="gm-fail-forward" onClick={() => appendGmDirection("failure")}>失败也前进</button>
                  {gmBeat === "余波" && <button onClick={() => appendGmDirection("aftermath")}>记录余波</button>}
                  <button className="gm-next-beat" onClick={advanceGmBeat} disabled={gmBeat === "余波"}>下一节拍 →</button>
                </div>
              </section>

              <section className="panel scene-table">
                <div className="scene-table-head">
                  <div>
                    <span>ACTIVE SCENE MODE</span>
                    <h2>场景牌桌</h2>
                    <p>把可见素材放上桌，锁住想保留的牌，再让玩家决定如何回应。</p>
                  </div>
                  <div className="scene-presets" aria-label="快速选择场景行动">
                    {(["情报判定", "感情判定", "回复判定", "战斗", "计划判定"] as SceneAction[]).map((action) => (
                      <button key={action} className={sceneAction === action ? "active" : ""} aria-pressed={sceneAction === action} onClick={() => setSceneAction(action)}>
                        {action.replace("判定", "")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="scene-table-body">
                  <div className="scene-deck-area">
                    <div className="scene-card-grid">
                      {sceneCards.map((card) => {
                        const locked = Boolean(lockedSceneCards[card.kind]);
                        return (
                          <article className={`scene-card kind-${card.kind} ${locked ? "locked" : ""}`} key={card.kind}>
                            <header>
                              <span>{card.kind}</span>
                              <button aria-label={`${locked ? "解锁" : "锁定"}${card.kind}牌`} aria-pressed={locked} onClick={() => toggleSceneCardLock(card)}>
                                {locked ? "已锁" : "锁定"}
                              </button>
                            </header>
                            <h3>{card.title}</h3>
                            <p>{card.body}</p>
                            <blockquote>{card.prompt}</blockquote>
                            <button className="scene-card-use" onClick={() => appendSceneCard(card)}>写入本场</button>
                          </article>
                        );
                      })}
                    </div>
                    <div className="scene-deck-actions">
                      <button onClick={rerollSceneCards}>重抽未锁定</button>
                      <button onClick={appendSceneDeck}>整组写入场景笔记</button>
                      <small>牌桌内容为原创主持灵感，不会改写判定、伤害、变调或秘密。</small>
                    </div>
                  </div>

                  <aside className="scene-oracle">
                    <header><span>SITUATION ORACLE</span><h3>局势神谕</h3></header>
                    <label>卡住时问一个可验证的问题<input value={oracleQuestion} onChange={(event) => setOracleQuestion(event.target.value)} placeholder="例如：目标是否仍在附近？" /></label>
                    <div className="oracle-likelihood" aria-label="发生倾向">
                      {(["不太可能", "五五开", "很可能"] as SceneOracleLikelihood[]).map((likelihood) => (
                        <button key={likelihood} className={oracleLikelihood === likelihood ? "active" : ""} aria-pressed={oracleLikelihood === likelihood} onClick={() => setOracleLikelihood(likelihood)}>{likelihood}</button>
                      ))}
                    </div>
                    <button className="oracle-roll" onClick={runSceneOracle}>询问局势 · 2D6</button>
                    {oracleResult ? (
                      <article className={`oracle-result ${oracleResult.tone}`} aria-live="polite">
                        <div><span>{oracleResult.dice[0]} ＋ {oracleResult.dice[1]}</span><strong>{oracleResult.label}</strong></div>
                        <p>{oracleResult.answer}</p>
                        <blockquote>{oracleResult.prompt}</blockquote>
                        {oracleResult.twist && <em>异变：{oracleResult.twist}</em>}
                        <button onClick={appendOracleResult}>写入本场</button>
                      </article>
                    ) : <p className="oracle-empty">选择倾向后掷骰。结果只回答局势方向，最终解释仍由 GM 与玩家共同完成。</p>}
                  </aside>
                </div>

                <div className="spotlight-ledger">
                  <div><span>SPOTLIGHT LEDGER</span><strong>镜头账本</strong><small>按已完成场景统计</small></div>
                  {spotlightLedger.map((entry) => (
                    <article key={entry.id}>
                      <header><b>{entry.name}</b><span>{entry.scenes} 场 · {entry.share}%</span></header>
                      <i><b style={{ width: `${entry.scenes ? Math.max(entry.share, 8) : 2}%` }} /></i>
                    </article>
                  ))}
                </div>
              </section>

              <div className="director-grid">
                <section className="panel scene-panel">
                  <div className="panel-heading battle-heading">
                    <div><span>SCENE DIRECTOR</span><h2>第 {cycle} 巡 · 第 {sceneNumber} 场</h2></div>
                    <button className="reveal-button" onClick={newCycle}>开始新巡</button>
                  </div>
                  <div className="scene-form">
                    <label>场景玩家<select value={sceneOwnerId} onChange={(event) => { setSceneOwnerId(event.target.value); setSceneParticipantIds((items) => items.includes(event.target.value) ? items : [...items, event.target.value]); }}>{characters.filter((character) => character.role === "PC").map((character) => <option key={character.id} value={character.id}>{character.name} · {character.acted ? "已行动" : "未行动"}</option>)}</select></label>
                    <label>主要行动<select value={sceneAction} onChange={(event) => setSceneAction(event.target.value as SceneAction)}>{(["未定", "回复判定", "情报判定", "感情判定", "战斗", "计划判定", "辅助判定"] as SceneAction[]).map((action) => <option key={action}>{action}</option>)}</select></label>
                  </div>
                  <div className="participant-picker"><span>登场人物</span>{characters.map((character) => <button key={character.id} className={sceneParticipantIds.includes(character.id) ? "active" : ""} onClick={() => toggleSceneParticipant(character.id)}>{character.name}</button>)}</div>
                  <label className={`scene-note ${tableSafe ? "masked-field" : ""}`}>场景摘要或判定结果<textarea value={tableSafe ? "桌面安全模式：主持摘要已隐藏" : sceneNote} disabled={tableSafe} onChange={(event) => setSceneNote(event.target.value)} placeholder="只记录推进所需的关键词；秘密内容可留在角色卡中。" /></label>
                  <button className="complete-scene" onClick={completeScene}>完成场景并轮到下一位</button>
                  <div className="acted-strip">{characters.filter((character) => character.role === "PC").map((character) => <span className={character.acted ? "done" : ""} key={character.id}>{character.acted ? "✓" : "○"} {character.name}</span>)}</div>
                </section>

                <section className="panel scenario-panel">
                  <div className="panel-heading"><div><span>SCENARIO CLOCKS</span><h2>事件与进度</h2></div></div>
                  <div className="tracker-list">{trackers.map((tracker) => <article key={tracker.id}><div><strong>{tracker.name}</strong><span>{tracker.value}/{tracker.max}</span></div><div className="tracker-bar"><i style={{ width: `${tracker.max ? (tracker.value / tracker.max) * 100 : 0}%` }} /></div><div className="tracker-buttons"><button onClick={() => updateTracker(tracker.id, -1)}>−</button><button onClick={() => updateTracker(tracker.id, 1)}>＋</button></div></article>)}</div>
                  <div className="inline-form tracker-form"><input value={trackerName} onChange={(event) => setTrackerName(event.target.value)} placeholder="新进度名称" /><input aria-label="进度上限" type="number" min="2" max="20" value={trackerMax} onChange={(event) => setTrackerMax(Number(event.target.value))} /><button onClick={addTracker}>添加</button></div>
                  <div className="cue-heading"><strong>主持事件</strong><span>到点自动提醒，不自动公开内容</span></div>
                  <div className="cue-list">{cues.length ? cues.slice().sort((a, b) => a.cycle - b.cycle || a.scene - b.scene).map((cue) => <button key={cue.id} className={`${cue.done ? "done" : ""} ${dueCues.some((item) => item.id === cue.id) ? "due" : ""}`} onClick={() => toggleCue(cue.id)}><span>C{cue.cycle}·S{cue.scene}</span><b>{tableSafe ? "主持事件已隐藏" : cue.title}</b><em>{cue.done ? "已处理" : "待处理"}</em></button>) : <p className="empty-log">还没有安排主持事件。</p>}</div>
                  <div className="cue-form"><input value={cueTitle} onChange={(event) => setCueTitle(event.target.value)} placeholder="例如：公开档案或检查条件" /><label>巡<input type="number" min="1" value={cueCycle} onChange={(event) => setCueCycle(Number(event.target.value))} /></label><label>场<input type="number" min="1" value={cueScene} onChange={(event) => setCueScene(Number(event.target.value))} /></label><button onClick={addCue}>安排</button></div>
                </section>
              </div>

              <section className="panel transcript-panel">
                <div className="panel-heading battle-heading">
                  <div><span>LOCAL REPLAY DESK</span><h2>跑团记录台</h2></div>
                  <span className="selection-count">{transcript ? `${transcript.scenes.length} 段 · ${transcript.entries.length} 行` : "尚未导入"}</span>
                </div>
                {!transcript ? <div className="transcript-empty">
                  <div><strong>把论坛 Log 或聊天记录变成可检索的场景索引</strong><p>识别「导入场景」「第×巡」「高潮阶段」与 &lt;角色名&gt; 对话；只在当前设备解析，不预置或上传模组正文与秘密。</p><button onClick={() => transcriptRef.current?.click()}>选择 UTF-8 文本</button></div>
                  <textarea value={transcriptDraft} onChange={(event) => setTranscriptDraft(event.target.value)} placeholder={"也可以直接粘贴记录……\n导入场景：召集\n<角色名> 台词"} />
                  <button className="parse-transcript" onClick={() => loadTranscript(transcriptDraft, "粘贴记录")} disabled={!transcriptDraft.trim()}>解析粘贴内容</button>
                  <input ref={transcriptRef} type="file" accept="text/plain,.log,.txt" onChange={importTranscriptFile} hidden />
                </div> : <>
                  <div className="transcript-toolbar">
                    <input aria-label="搜索跑团记录" value={transcriptQuery} onChange={(event) => setTranscriptQuery(event.target.value)} placeholder="搜索台词、判定或关键词" />
                    <select aria-label="筛选记录片段" value={transcriptSceneId} onChange={(event) => setTranscriptSceneId(event.target.value)}><option value="all">全部片段</option>{transcript.scenes.map((scene) => <option value={scene.id} key={scene.id}>{scene.title}（{scene.entryCount}）</option>)}</select>
                    <select aria-label="筛选发言者" value={transcriptSpeaker} onChange={(event) => setTranscriptSpeaker(event.target.value)}><option value="">全部发言者</option>{transcript.speakers.map((speaker) => <option value={speaker.name} key={speaker.name}>{speaker.name}（{speaker.count}）</option>)}</select>
                    <button onClick={() => transcriptRef.current?.click()}>换一份记录</button>
                    <button className="remove-transcript" onClick={() => setTranscript(null)}>移除</button>
                    <input ref={transcriptRef} type="file" accept="text/plain,.log,.txt" onChange={importTranscriptFile} hidden />
                  </div>
                  <div className={`transcript-list ${tableSafe ? "masked-transcript" : ""}`}>
                    {tableSafe ? <div className="transcript-mask"><strong>桌面安全模式</strong><span>跑团记录可能包含秘密，当前已整体遮盖。</span></div> : filteredTranscript.length ? filteredTranscript.map((entry) => <article className={entry.kind} key={entry.id}>
                      <span>{entry.line}</span><div>{entry.speaker && <b>{entry.speaker}</b>}<p>{entry.text}</p></div><button onClick={() => appendTranscriptEntry(entry)}>加入场景笔记</button>
                    </article>) : <p className="empty-log">没有符合筛选条件的记录。</p>}
                  </div>
                  <div className="transcript-foot"><span>{transcript.sourceName}</span><em>显示 {filteredTranscript.length} 条{transcript.truncated ? " · 超长记录已截取前 5000 条" : ""}</em></div>
                </>}
              </section>

              <section className="panel intel-panel">
                <div className="panel-heading battle-heading"><div><span>RELATIONSHIP & INTEL</span><h2>人物关系与情报流向</h2></div><span className="selection-count">共享不连锁</span></div>
                <div className="relationship-grid">
                  <div className="relation-builder">
                    <h3>建立定向感情</h3>
                    <div className="relation-form"><select value={emotionFromId} onChange={(event) => setEmotionFromId(event.target.value)}>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select><span>对</span><select value={emotionToId} onChange={(event) => setEmotionToId(event.target.value)}>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select><select value={emotionIndex} onChange={(event) => setEmotionIndex(Number(event.target.value))}>{EMOTION_PAIRS.map((pair, index) => <option key={pair.join("/")} value={index}>{pair[0]} / {pair[1]}</option>)}</select><select value={emotionPositive ? "positive" : "negative"} onChange={(event) => setEmotionPositive(event.target.value === "positive")}><option value="positive">正面</option><option value="negative">负面</option></select><button onClick={addEmotion}>逐向记录</button></div>
                    <small>感情判定成功后，场景玩家与同场目标各自掷 1D6，并分别决定正面或负面；请为两个方向各记录一次。</small>
                    <div className="emotion-list">{emotions.length ? emotions.map((emotion) => { const from = characters.find((character) => character.id === emotion.fromId)?.name; const to = characters.find((character) => character.id === emotion.toId)?.name; return <article key={emotion.id} className={emotion.positive ? "positive" : "negative"}><div><strong>{from}</strong><span>→</span><strong>{to}</strong><b>{emotion.label}</b></div><button className={emotion.used ? "used" : ""} onClick={() => markEmotionUsed(emotion.id)}>{emotion.used ? "本轮已修正" : `${emotion.positive ? "+1" : "−1"} 修正`}</button></article>; }) : <p className="empty-log">尚未建立感情。</p>}</div>
                  </div>
                  <div className="intel-builder">
                    <h3>直接获得情报</h3>
                    <div className="intel-form"><select value={intelReceiverId} onChange={(event) => setIntelReceiverId(event.target.value)}>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select><span>获得</span><select value={intelSubjectId} onChange={(event) => setIntelSubjectId(event.target.value)}>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select><select value={intelKind} onChange={(event) => setIntelKind(event.target.value as IntelKind)}><option>秘密</option><option>居所</option><option>奥义</option></select><button onClick={gainIntel}>结算共享</button></div>
                    <div className="intel-list">{intel.length ? intel.map((record) => { const subjectName = characters.find((character) => character.id === record.subjectId)?.name ?? "已移除角色"; return <article key={`${record.subjectId}-${record.kind}`}><strong>{subjectName} · {record.kind}</strong><div>{record.knownBy.map((id) => <span key={id}>{characters.find((character) => character.id === id)?.name ?? "?"}</span>)}</div></article>; }) : <p className="empty-log">尚未记录已知情报。</p>}</div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <section className="panel sheet-panel">
              <div className="panel-heading battle-heading"><div><span>CHARACTER WORKBENCH</span><h2>角色工作台</h2></div><span className="selection-count">{selected.faction} · {selected.rank} · {selected.skills.length} 特技</span></div>
              <div className="character-dossier">
                <div className="portrait-column">
                  <button className={`portrait-frame ${selected.portrait ? "has-image" : ""}`} onClick={() => portraitRef.current?.click()} style={selected.portrait ? { backgroundImage: `url(${selected.portrait})` } : undefined}>
                    {!selected.portrait && <><span>立绘</span><b>{selected.name.slice(0, 2)}</b><em>选择本地图片</em></>}
                  </button>
                  <input ref={portraitRef} type="file" accept="image/*" onChange={importPortrait} hidden />
                  {selected.portrait && <button className="remove-portrait" onClick={() => updateCharacter(selected.id, { portrait: "" })}>移除立绘</button>}
                  <div className="dossier-stamp"><span>{selected.role}</span><strong>{selected.belief || "信念未定"}</strong><em>功绩点 {selected.merit ?? 0}</em></div>
                </div>
                <div className="identity-grid expanded">
                  <label className="name-field">角色名<input value={selected.name} onChange={(event) => updateCharacter(selected.id, { name: event.target.value })} /></label>
                  <label>玩家<input value={selected.player ?? ""} onChange={(event) => updateCharacter(selected.id, { player: event.target.value })} /></label>
                  <label>流派<input value={selected.faction} onChange={(event) => updateCharacter(selected.id, { faction: event.target.value })} /></label>
                  <label>下位流派<input value={selected.subFaction ?? ""} onChange={(event) => updateCharacter(selected.id, { subFaction: event.target.value })} placeholder="如无可留空" /></label>
                  <label>阶级<select value={selected.rank} onChange={(event) => updateCharacter(selected.id, { rank: event.target.value })}><option>下忍</option><option>中忍</option><option>中忍头</option><option>上忍</option><option>上忍头</option><option>头领</option></select></label>
                  <label>习得条件<input value={selected.condition ?? ""} onChange={(event) => updateCharacter(selected.id, { condition: event.target.value })} placeholder="条件" /></label>
                  <label>流仪<input value={selected.style ?? ""} onChange={(event) => updateCharacter(selected.id, { style: event.target.value })} /></label>
                  <label>年龄<input value={selected.age ?? ""} onChange={(event) => updateCharacter(selected.id, { age: event.target.value })} /></label>
                  <label>性别<input value={selected.gender ?? ""} onChange={(event) => updateCharacter(selected.id, { gender: event.target.value })} /></label>
                  <label>表之颜<input value={selected.cover ?? ""} onChange={(event) => updateCharacter(selected.id, { cover: event.target.value })} /></label>
                  <label>信念<input value={selected.belief ?? ""} onChange={(event) => updateCharacter(selected.id, { belief: event.target.value })} /></label>
                  <label>仇敌<input value={selected.enemy ?? ""} onChange={(event) => updateCharacter(selected.id, { enemy: event.target.value })} /></label>
                  <label>功绩点<input type="number" value={selected.merit ?? 0} onChange={(event) => updateCharacter(selected.id, { merit: Number(event.target.value) })} /></label>
                  <label>类型<select value={selected.role} onChange={(event) => updateCharacter(selected.id, { role: event.target.value as Character["role"] })}><option>PC</option><option>NPC</option></select></label>
                </div>
              </div>
              <div className="narrative-grid expanded-narrative">
                <label>使命<textarea value={selected.mission} onChange={(event) => updateCharacter(selected.id, { mission: event.target.value })} /></label>
                <label className={tableSafe ? "masked-field" : ""}>秘密<textarea value={tableSafe ? "桌面安全模式：秘密已隐藏" : selected.secret} disabled={tableSafe} onChange={(event) => updateCharacter(selected.id, { secret: event.target.value })} /></label>
                <label>人物故事<textarea value={selected.story ?? ""} onChange={(event) => updateCharacter(selected.id, { story: event.target.value })} placeholder="外表、性格、经历与角色钩子" /></label>
                <label>背景<textarea value={selected.backgrounds ?? ""} onChange={(event) => updateCharacter(selected.id, { backgrounds: event.target.value })} placeholder="每行一个背景，可写类型与效果摘要" /></label>
              </div>
              <section className="background-sheet">
                <div className="subsection-heading"><div><span>BACKGROUND LIST</span><h3>背景清单</h3></div><small>结构化条目支持从纯文本角色卡自动识别</small></div>
                <div className="background-table" role="table" aria-label="背景清单">
                  <div className="background-table-head" role="row"><span>序号</span><span>名称</span><span>类别</span><span>功绩点</span><span>效果</span><span /></div>
                  {selected.backgroundItems.length ? selected.backgroundItems.map((item) => <div className="background-table-row" role="row" key={item.id}>
                    <input aria-label="背景序号" value={item.serial} onChange={(event) => updateBackgroundItem(item.id, { serial: event.target.value })} placeholder="序号" />
                    <input aria-label="背景名称" value={item.name} onChange={(event) => updateBackgroundItem(item.id, { name: event.target.value })} />
                    <input aria-label="背景类别" value={item.category} onChange={(event) => updateBackgroundItem(item.id, { category: event.target.value })} placeholder="长处／短处" />
                    <input aria-label="背景功绩点" type="number" value={item.points} onChange={(event) => updateBackgroundItem(item.id, { points: Number(event.target.value) || 0 })} />
                    <input aria-label="背景效果" value={item.effect} onChange={(event) => updateBackgroundItem(item.id, { effect: event.target.value })} placeholder="效果摘要（勿粘贴规则书原文）" />
                    <button aria-label={`删除背景 ${item.name}`} onClick={() => removeBackgroundItem(item.id)}>×</button>
                  </div>) : <p className="empty-log">还没有结构化背景；可手动添加，或粘贴角色卡文本自动识别背景清单行。</p>}
                </div>
                <div className="background-foot">
                  <button onClick={addBackgroundItem}>＋ 添加背景</button>
                  <em>功绩点小计：{selected.backgroundItems.reduce((sum, item) => sum + item.points, 0)}（长处为正、短处为负）</em>
                </div>
              </section>
              <div className="ougi-grid">
                <label>奥义名<input value={selected.ougi} onChange={(event) => updateCharacter(selected.id, { ougi: event.target.value })} /></label>
                <label>指定特技<input value={selected.ougiSkill ?? ""} onChange={(event) => updateCharacter(selected.id, { ougiSkill: event.target.value })} /></label>
                <label>效果<input value={selected.ougiEffect ?? ""} onChange={(event) => updateCharacter(selected.id, { ougiEffect: event.target.value })} /></label>
                <label>强化<input value={selected.ougiStrength ?? ""} onChange={(event) => updateCharacter(selected.id, { ougiStrength: event.target.value })} /></label>
                <label>弱点<input value={selected.ougiWeakness ?? ""} onChange={(event) => updateCharacter(selected.id, { ougiWeakness: event.target.value })} /></label>
              </div>
              <div className="gap-controls"><span>特技空隙</span>{FIELD_NAMES.slice(0, -1).map((field, index) => <button key={field} className={selected.closedGaps?.[index] ? "closed" : ""} onClick={() => toggleGap(index)}>{field}/{FIELD_NAMES[index + 1]} · {selected.closedGaps?.[index] ? "已填" : "空白"}</button>)}<em>填黑的空隙不计格数</em></div>
              <div className="skill-matrix">
                {FIELD_NAMES.map((field) => <div className={`skill-column ${selected.life[field] ? "" : "disabled-field"}`} key={field}><button className="field-life" onClick={() => toggleLife(field)}><span>{field}</span><i>{selected.life[field] ? "●" : "×"}</i></button>{SKILL_TABLE[field].map((skill) => <button key={skill} className={selected.skills.includes(skill) ? "learned" : ""} onClick={() => toggleSkill(skill)}>{skill}</button>)}</div>)}
              </div>
              <section className="text-importer">
                <div><span>SMART IMPORT</span><h3>纯文字角色卡导入</h3><p>支持文件夹中自动角色卡的「纯文字化」格式，也会识别日文特技名。内容只在当前设备解析。</p></div>
                <textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder={"粘贴角色卡文本，例如：\n名前：角色名\n流派：鞍马神流\n階級：中忍\n使命：……\n特技：刀術、走法……"} />
                <div className="import-preview"><span>识别 {importPreview.recognized} 项</span><b>{importPreview.name ?? "未识别姓名"}</b><em>{importPreview.skills.length} 特技 · {importPreview.ninpoIds.length} 忍法</em><button onClick={applyCharacterImport} disabled={!importPreview.recognized}>应用到当前角色</button></div>
              </section>
              <section className="interop-panel">
                <div className="subsection-heading">
                  <div><span>OPEN-SOURCE BRIDGES</span><h3>开源团务互通桥</h3></div>
                  <small>导出结构，不上传资料，也不内置外部项目代码或规则表正文</small>
                </div>
                <div className="interop-source-strip">
                  <a href="https://github.com/bcdice/BCDice" target="_blank" rel="noreferrer"><b>BCDice</b><span>BSD-3-Clause · nSG@s#f&gt;=x</span></a>
                  <a href="https://github.com/neotaso/CCFOLIA-Akyou" target="_blank" rel="noreferrer"><b>CCFOLIA Clipboard</b><span>MIT · character JSON</span></a>
                  <a href="https://github.com/ksx0330/FVTT-Shinobigami-System" target="_blank" rel="noreferrer"><b>Foundry VTT</b><span>MIT · Actor / Item schema</span></a>
                </div>
                <div className="interop-body">
                  <div className="interop-preview"><span>BCDice 调色板预览</span><pre>{createBCDicePalette(selected, allNinpo).split("\n").slice(0, 5).join("\n")}</pre></div>
                  <div className="interop-actions">
                    <label className={tableSafe ? "disabled" : ""}><input type="checkbox" checked={interopPrivate && !tableSafe} disabled={tableSafe} onChange={(event) => setInteropPrivate(event.target.checked)} />导出时包含秘密与奥义</label>
                    <p>{tableSafe ? "桌面安全模式已锁定：所有出口只含公开资料。" : interopPrivate ? "私人资料将进入 CCFOLIA 备忘与 Foundry Handout；请只交给对应玩家或 GM。" : "默认只导出公开资料；本地立绘不会嵌入 JSON。"}</p>
                    <div><button onClick={copyBCDicePalette}>复制 BCDice 调色板</button><button onClick={copyCCFoliaCharacter}>复制 CCFOLIA 角色</button><button className="foundry-export" onClick={downloadFoundryActor}>导出 Foundry Actor</button></div>
                  </div>
                </div>
              </section>
              <section className="equipped-ninpo-sheet">
                <div className="subsection-heading"><div><span>AUTOMATIC NINPO LIST</span><h3>已装备忍法清单</h3></div><small>效果仅保存你的摘要；完整规则仍以所用规则书为准</small></div>
                <div className="ninpo-table" role="table" aria-label="已装备忍法清单">
                  <div className="ninpo-table-head" role="row"><span>忍法</span><span>类型</span><span>指定特技</span><span>距离</span><span>花费</span><span>效果摘要</span></div>
                  {allNinpo.filter((ninpo) => selected.ninpoIds.includes(ninpo.id)).map((ninpo) => <div className="ninpo-table-row" role="row" key={ninpo.id}><strong>{ninpo.name}{(ninpo.serial || ninpo.school) && <small className="ninpo-origin">{[ninpo.serial, ninpo.school].filter(Boolean).join(" · ")}</small>}</strong><span>{ninpo.kind}</span><span>{ninpo.skill}</span><span>{ninpo.range >= 99 ? "无" : ninpo.range}</span><span>{ninpo.cost || "无"}</span><p>{ninpo.summary}{ninpo.note && <span className="ninpo-note">备忘：{ninpo.note}</span>}</p></div>)}
                </div>
              </section>
              <section className="ninpo-loadout">
                <div className="subsection-heading"><div><span>REPEATING LOADOUT</span><h3>忍法配置</h3></div><small>点击添加或移出当前角色</small></div>
                <div className="ninpo-library">{allNinpo.map((ninpo) => <div className={selected.ninpoIds.includes(ninpo.id) ? "equipped" : ""} key={ninpo.id}><button onClick={() => toggleNinpo(ninpo.id)}><b>{ninpo.name}</b><span>{ninpo.kind} · {ninpo.skill} · 距{ninpo.range} · 费{ninpo.cost}</span></button>{customNinpo.some((item) => item.id === ninpo.id) && <button className="remove-custom" aria-label={`删除自定义忍法 ${ninpo.name}`} onClick={() => deleteCustomNinpo(ninpo.id)}>×</button>}</div>)}</div>
                <div className="custom-ninpo-form">
                  <input aria-label="自定义忍法名" placeholder="自定义忍法名" value={customName} onChange={(event) => setCustomName(event.target.value)} />
                  <select aria-label="忍法类型" value={customKind} onChange={(event) => setCustomKind(event.target.value as Ninpo["kind"])}><option>攻击</option><option>支援</option><option>装备</option></select>
                  <select aria-label="指定特技" value={customSkill} onChange={(event) => setCustomSkill(event.target.value)}>{FIELD_NAMES.map((field) => <optgroup label={field} key={field}>{SKILL_TABLE[field].map((skill) => <option key={skill}>{skill}</option>)}</optgroup>)}</select>
                  <label>距离<input type="number" min="0" max="99" value={customRange} onChange={(event) => setCustomRange(Number(event.target.value))} /></label>
                  <label>花费<input type="number" min="0" max="99" value={customCost} onChange={(event) => setCustomCost(Number(event.target.value))} /></label>
                  <input className="custom-summary" aria-label="自定义忍法效果摘要" placeholder="效果摘要（请勿粘贴整段规则书原文）" value={customSummary} onChange={(event) => setCustomSummary(event.target.value)} />
                  <input className="custom-note" aria-label="自定义忍法备忘" placeholder="备忘（可选）" value={customNote} onChange={(event) => setCustomNote(event.target.value)} />
                  <button onClick={addCustomNinpo}>＋ 加入配置</button>
                </div>
              </section>
            </section>
          )}

          {view !== "tutorial" && <section className="panel status-panel">
            <div className="status-block life-block"><span className="mini-label">LIFE / 生命力</span><div className="field-toggles">{FIELD_NAMES.map((field) => <button key={field} className={selected.life[field] ? "healthy" : "lost"} onClick={() => toggleLife(field)}><i />{field}</button>)}</div><div className="extra-life"><span>追加生命力</span><button onClick={() => updateCharacter(selected.id, { extraLife: Math.max(0, selected.extraLife - 1) })}>−</button><strong>{selected.extraLife}</strong><button onClick={() => updateCharacter(selected.id, { extraLife: selected.extraLife + 1 })}>＋</button><button className={`active-toggle ${selected.active ? "" : "dropped"}`} onClick={toggleActive}>{selected.active ? "参战中" : "已脱落"}</button></div></div>
            <div className="status-block"><span className="mini-label">CONDITION / 变调·状态</span><div className="condition-list">{CONDITIONS.map((condition) => <button key={condition} className={selected.conditions.includes(condition) ? "active" : ""} onClick={() => toggleCondition(condition)}>{condition}</button>)}</div></div>
            <div className="status-block"><span className="mini-label">TOOLS / 忍具</span><div className="tool-list">{(Object.keys(selected.tools) as Array<keyof Character["tools"]>).map((tool) => <div key={tool}><span>{tool}</span><button onClick={() => updateTool(tool, -1)}>−</button><b>{selected.tools[tool]}</b><button onClick={() => updateTool(tool, 1)}>＋</button></div>)}</div></div>
          </section>}
        </section>

        {view !== "tutorial" && <aside className="log-panel panel">
          <div className="side-tabs"><button className={sideView === "assistant" ? "active" : ""} onClick={() => setSideView("assistant")}>智能提示</button><button className={sideView === "log" ? "active" : ""} onClick={() => setSideView("log")}>团务记录</button><button className={sideView === "rules" ? "active" : ""} onClick={() => setSideView("rules")}>规则速查</button></div>
          {sideView === "assistant" ? <div className="assistant-view">
            <div className="panel-heading"><div><span>RULE-AWARE ASSISTANT</span><h2>当前状态检查</h2></div><span className="counter">{smartHints.length}</span></div>
            <div className="hint-list">{smartHints.map((hint, index) => <article className={hint.tone} key={`${hint.title}-${index}`}><span>{hint.tone === "good" ? "✓" : hint.tone === "danger" ? "!" : "·"}</span><div><h3>{hint.title}</h3><p>{hint.detail}</p></div></article>)}</div>
            <div className="assistant-summary"><span>当前位置</span><strong>{phase === "导入" ? "开团检查" : phase === "主要" ? `第 ${cycle} 巡 · 第 ${sceneNumber} 场` : `第 ${round} 回合`}</strong><p>提示由当前状态和规则条件生成，不会替 GM 作剧情裁定。</p></div>
          </div> : sideView === "log" ? <>
            <div className="panel-heading"><div><span>SESSION LOG</span><h2>{phase}阶段 · {phase === "主要" ? `第 ${cycle} 巡` : `第 ${round} 回合`}</h2></div><button className="clear-log" onClick={() => setLogs([])}>清空</button></div>
            <form className="dice-maiden" onSubmit={(event) => { event.preventDefault(); const outcome = rollDiceCommand(diceInput, Math.random, { name: selected?.name ?? "GM", date: new Date().toISOString().slice(0, 10), skillTable: SKILL_TABLE, decks: listSceneCardDecks() }); if (!outcome) { setDiceHint(diceInput.trim() ? `骰娘歪了歪头：这句没看懂。${DICE_MAIDEN_HINT}` : DICE_MAIDEN_HINT); return; } addLog(`[骰娘]${outcome.hidden ? "[暗骰]" : ""} ${outcome.text}${outcome.flavor ? `「${outcome.flavor}」` : ""}`, outcome.tone); setDiceInput(""); setDiceHint(""); }}>
              <input aria-label="骰娘指令" value={diceInput} onChange={(event) => setDiceInput(event.target.value)} placeholder="对骰娘说：2d6+3 · 3SG>=5 · rh 暗骰 · draw 地点 · jrrp · help" />
              <button type="submit">掷</button>
              {diceHint ? <p className="dice-maiden-hint">{diceHint}</p> : null}
            </form>
            <div className="log-list">{logs.length ? logs.slice().reverse().map((entry) => <article className={`log-entry ${entry.tone}`} key={entry.id}><span>{phase === "主要" ? `C${entry.cycle ?? cycle}` : `R${entry.round}`}</span><p>{tableSafe ? "桌面安全模式：记录内容已隐藏" : entry.text}</p></article>) : <p className="empty-log">还没有记录。</p>}</div>
          </> : <div className="rules-list">
            <article><span>01</span><div><h3>行为判定</h3><p>目标值＝5＋指定特技到所用已习得特技的格数。默认选择最近特技，玩家也可以主动选择更远的特技代用；目标值不封顶。</p></div></article>
            <article><span>02</span><div><h3>特殊骰点</h3><p>大成功与大失败只看修正前骰点。通常 12 为大成功、2 为大失败；战斗从攻击处理到回合结束，大失败值改为当前布局值并造成逆止。</p></div></article>
            <article><span>03</span><div><h3>布局与行动</h3><p>秘密选择 1–6 后同时公开，由高到低行动；高布局更快，但大失败风险也更高。</p></div></article>
            <article><span>04</span><div><h3>距离与花费</h3><p>双方布局差不得超过忍法距离；同回合忍法累计花费不得超过自己的布局值。</p></div></article>
            <article><span>05</span><div><h3>伤害</h3><p>接近战随机失去分野生命力；射击战由受伤者选择；集体战通常获得变调。</p></div></article>
            <article><span>06</span><div><h3>BCDice 风格</h3><p>本工具日志记录 SG 命令。额外骰池采用 nSG 的“投 n 颗、取高 2 颗”方式。</p></div></article>
            <article><span>07</span><div><h3>情报共享</h3><p>当你抱有感情的角色直接获得情报时，你自动获得同一情报；共享所得不会继续触发连锁共享。</p></div></article>
            <article><span>08</span><div><h3>巡与场景</h3><p>主要阶段每位 PC 每巡有一次主要行动。剧情场景从回复、情报、感情中择一；GM 还可按剧本设置计划判定。辅助判定是 GM 设置的简单行动，不消耗主要行动。</p></div></article>
            <article><span>09</span><div><h3>宣言窗口</h3><p>同一时机可能有多个效果时，先询问是否继续宣言；确认无人追加后再推进回避或效果，避免错过时机后回溯。</p></div></article>
            <article><span>10</span><div><h3>同速批次</h3><p>同一布局的攻击视为同时发生；先完成同速角色的攻击，再统一应用生命减少、逆止、变调与附带效果。</p></div></article>
          </div>}
          <div className="log-footer"><button onClick={clearSession}>重置示例团</button><p>本工具仅提供规则辅助，特殊效果以 GM 裁定为准。</p></div>
        </aside>}
      </div>
    </main>
  );
}
