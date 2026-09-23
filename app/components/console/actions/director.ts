import type { ChangeEvent } from "react";
import { askSceneOracle } from "../../../lib/director";
import type { SceneCard } from "../../../lib/director";
import { GM_BEATS, composeGmNote } from "../../../lib/gm";
import type { GmPressure } from "../../../lib/gm";
import { EMOTION_PAIRS, clearBattleRoundState, uid } from "../../../lib/rules";
import type { Emotion } from "../../../lib/session";
import { parseTranscript } from "../../../lib/transcript";
import type { TranscriptEntry } from "../../../lib/transcript";
import type { ConsoleBase } from "../types";
import type { BattleActions } from "./battle";
import type { RosterActions } from "./roster";

export function createDirectorActions(ctx: ConsoleBase & RosterActions & BattleActions) {
  const {
    addLog, brief, characters, checkpoint, closeBattle, cueCycle, cueScene, cueTitle, cycle, emotionFromId,
    emotionIndex, emotionPositive, emotionToId, emotions, gmBeat, gmBrief, intelKind, intelReceiverId,
    intelSubjectId, oracleLikelihood, oracleNonce, oracleQuestion, oracleResult, sceneAction, sceneCards, sceneNote,
    sceneNumber, sceneOwnerId, sceneParticipantIds, selectCharacter, setCharacters, setCueTitle, setCues, setCycle,
    setEmotions, setGmBeat, setGmPressure, setIntel, setLockedSceneCards, setOracleNonce, setOracleQuestion,
    setOracleResult, setSceneAction, setSceneDeckNonce, setSceneNote, setSceneNumber, setSceneOwnerId,
    setSceneParticipantIds, setTrackerName, setTrackers, setTranscript, setTranscriptDraft, setTranscriptQuery,
    setTranscriptSceneId, setTranscriptSpeaker, trackerMax, trackerName,
  } = ctx;

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
    selectCharacter(gmBrief.spotlight.id);
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
    closeBattle();
    setCharacters((items) => items.map((character) => clearBattleRoundState(character.id === owner.id ? { ...character, acted: true } : character)));
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
    closeBattle();
    setCharacters((items) => items.map((character) => clearBattleRoundState({ ...character, acted: false })));
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
    setEmotions((items) => {
      const picked = items.find((emotion) => emotion.id === emotionId);
      if (!picked) return items;
      // 规则：复数感情在同一巡／回合内也只能使用一次感情修正——按持有者整体加锁/解锁
      const nextUsed = !picked.used;
      return items.map((emotion) => emotion.fromId === picked.fromId ? { ...emotion, used: nextUsed } : emotion);
    });
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

  return {
    toggleSceneParticipant, appendGmDirection, acceptSuggestedAction, acceptGmSpotlight, toggleSceneCardLock,
    rerollSceneCards, appendSceneCard, appendSceneDeck, runSceneOracle, appendOracleResult, advanceGmBeat,
    completeScene, newCycle, addEmotion, markEmotionUsed, gainIntel, addCue, toggleCue, updateTracker, addTracker,
    loadTranscript, importTranscriptFile, appendTranscriptEntry,
  };
}

export type DirectorActions = ReturnType<typeof createDirectorActions>;
