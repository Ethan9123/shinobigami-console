import { useRef, useState } from "react";
import type { GmBeat, GmPressure } from "../../lib/gm";
import type { IntelKind } from "../../lib/session";
import type { Ninpo } from "../../lib/rules";
import type { ReplayEnding, ReplayGenre, ReplayLength, ReplayMode } from "../../lib/replay";
import type { SceneCard, SceneCardKind, SceneOracleLikelihood, SceneOracleResult } from "../../lib/director";
import type { CharacterWorkbookImport } from "../../lib/xlsx-import";
import type { ConsoleView } from "./context";
import { INITIAL_STATE } from "./store/useGameStore";

export function useConsoleUi() {
  const [view, setView] = useState<ConsoleView>("tutorial");
  const [openLessonId, setOpenLessonId] = useState<string>("");
  const [targetSkill, setTargetSkill] = useState("刀术");
  const [substituteSkillChoice, setSubstituteSkillChoice] = useState("auto");
  const [modifier, setModifier] = useState(0);
  const [lastRoll, setLastRoll] = useState<{ dice: number[]; kept: number[]; total: number; result: string } | null>(null);
  const [selectedNinpoId, setSelectedNinpoId] = useState("close");
  const [targetId, setTargetId] = useState(INITIAL_STATE.characters[1].id);
  const [diceCount, setDiceCount] = useState(2);
  const [tableSafe, setTableSafe] = useState(false);
  const [diceInput, setDiceInput] = useState("");
  const [diceHint, setDiceHint] = useState("");
  const [supportCostInput, setSupportCostInput] = useState(0);
  const [reversalExempt, setReversalExempt] = useState(false);
  const [attackOverride, setAttackOverride] = useState(false);
  const [sideView, setSideView] = useState<"log" | "rules" | "assistant">("assistant");
  const [customName, setCustomName] = useState("");
  const [customSkill, setCustomSkill] = useState("刀术");
  const [customRange, setCustomRange] = useState(1);
  const [customCost, setCustomCost] = useState(0);
  const [customKind, setCustomKind] = useState<Ninpo["kind"]>("攻击");
  const [customSummary, setCustomSummary] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [treasureName, setTreasureName] = useState("");
  const [treasureNote, setTreasureNote] = useState("");
  const [treasureTargets, setTreasureTargets] = useState<Record<string, string>>({});
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
  const [workbookImport, setWorkbookImport] = useState<CharacterWorkbookImport | null>(null);
  const [workbookImportStatus, setWorkbookImportStatus] = useState("可读取带「纯文字化」工作表的 .xlsx 角色卡");
  const [characterLibraryStatus, setCharacterLibraryStatus] = useState("角色库只保存在这台设备；载入时会重置生命力、变调与布局。 ");

  return {
    view, setView, openLessonId, setOpenLessonId, targetSkill, setTargetSkill, substituteSkillChoice,
    setSubstituteSkillChoice, modifier, setModifier, lastRoll, setLastRoll, selectedNinpoId, setSelectedNinpoId,
    targetId, setTargetId, diceCount, setDiceCount, tableSafe, setTableSafe, diceInput, setDiceInput, diceHint,
    setDiceHint, supportCostInput, setSupportCostInput, reversalExempt, setReversalExempt, attackOverride,
    setAttackOverride, sideView, setSideView, customName, setCustomName, customSkill, setCustomSkill, customRange,
    setCustomRange, customCost, setCustomCost, customKind, setCustomKind, customSummary, setCustomSummary, customNote,
    setCustomNote, treasureName, setTreasureName, treasureNote, setTreasureNote, treasureTargets, setTreasureTargets,
    replayMode, setReplayMode, replayGenre, setReplayGenre, replayLength, setReplayLength, replayEnding,
    setReplayEnding, replayIntensity, setReplayIntensity, replaySeed, setReplaySeed, replayHeroId, setReplayHeroId,
    replayRevealSecrets, setReplayRevealSecrets, interopPrivate, setInteropPrivate, gmBeat, setGmBeat, gmPressure,
    setGmPressure, sceneDeckNonce, setSceneDeckNonce, lockedSceneCards, setLockedSceneCards, oracleQuestion,
    setOracleQuestion, oracleLikelihood, setOracleLikelihood, oracleResult, setOracleResult, oracleNonce,
    setOracleNonce, transcriptDraft, setTranscriptDraft, transcriptQuery, setTranscriptQuery, transcriptSpeaker,
    setTranscriptSpeaker, transcriptSceneId, setTranscriptSceneId, emotionFromId, setEmotionFromId, emotionToId,
    setEmotionToId, emotionIndex, setEmotionIndex, emotionPositive, setEmotionPositive, intelReceiverId,
    setIntelReceiverId, intelSubjectId, setIntelSubjectId, intelKind, setIntelKind, cueTitle, setCueTitle, cueCycle,
    setCueCycle, cueScene, setCueScene, trackerName, setTrackerName, trackerMax, setTrackerMax, importText,
    setImportText, workbookImport, setWorkbookImport, workbookImportStatus, setWorkbookImportStatus,
    characterLibraryStatus, setCharacterLibraryStatus,
  };
}

export type ConsoleUi = ReturnType<typeof useConsoleUi>;

export function useConsoleRefs() {
  const importRef = useRef<HTMLInputElement>(null);
  const workbookRef = useRef<HTMLInputElement>(null);
  const portraitRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLInputElement>(null);

  return { importRef, workbookRef, portraitRef, transcriptRef };
}
