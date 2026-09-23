import type { ChangeEvent, FormEvent } from "react";
import { DICE_MAIDEN_HINT, rollDiceCommand } from "../../../lib/dice";
import { listSceneCardDecks } from "../../../lib/director";
import type { Locale } from "../../../lib/i18n";
import { SKILL_TABLE, uid } from "../../../lib/rules";
import { createInitialGameState, normalizeGameState } from "../../../lib/session";
import type { Phase } from "../../../lib/session";
import type { ConsoleBase } from "../types";

export function createSessionActions(ctx: ConsoleBase) {
  const {
    addLog, checkpoint, currentState, diceInput, persistAcademyProgress, persistLocale, phase, round, selected,
    setAcademyDone, setDiceHint, setDiceInput, setGame, setGmBeat, setGmPressure, setInteropPrivate, setLastRoll,
    setLocale, setPhase, setReplayEnding, setReplayGenre, setReplayHeroId, setReplayIntensity, setReplayLength,
    setReplayMode, setReplayRevealSecrets, setReplaySeed, setTargetId, setTranscriptDraft, setTranscriptQuery,
    setTranscriptSceneId, setTranscriptSpeaker, setTreasureName, setTreasureNote, setTreasureTargets, setView,
  } = ctx;

  const changePhase = (next: Phase) => {
    if (next === phase) return;
    checkpoint();
    setPhase(next);
    addLog(`团务阶段切换为「${next}阶段」。`, "system");
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
        setGame({ ...parsed, logs: [...parsed.logs.slice(-499), { id: uid("log"), round: parsed.round, cycle: parsed.cycle, tone: "system", text: `已导入存档：${file.name}` }] });
        setGmBeat("定调");
        setGmPressure(1);
      } catch {
        addLog("存档无法读取，请确认文件来自本控制台。", "danger");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const clearSession = () => {
    checkpoint();
    const fresh = createInitialGameState();
    setGame(fresh);
    setTargetId(fresh.characters.find((character) => character.id !== fresh.selectedId)?.id ?? fresh.selectedId);
    setTreasureName("");
    setTreasureNote("");
    setTreasureTargets({});
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
    setView("tutorial");
    setLastRoll(null);
  };

  const switchLocale = (next: Locale) => {
    setLocale(next);
    persistLocale(next);
  };

  const toggleLessonDone = (lessonId: string) => {
    setAcademyDone((current) => {
      const next = current.includes(lessonId) ? current.filter((id) => id !== lessonId) : [...current, lessonId];
      persistAcademyProgress(next);
      return next;
    });
  };

  const submitDiceCommand = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const outcome = rollDiceCommand(diceInput, Math.random, { name: selected?.name ?? "GM", date: new Date().toISOString().slice(0, 10), skillTable: SKILL_TABLE, decks: listSceneCardDecks() });
    if (!outcome) {
      setDiceHint(diceInput.trim() ? `骰娘歪了歪头：这句没看懂。${DICE_MAIDEN_HINT}` : DICE_MAIDEN_HINT);
      return;
    }
    addLog(`[骰娘]${outcome.hidden ? "[暗骰]" : ""} ${outcome.text}${outcome.flavor ? `「${outcome.flavor}」` : ""}`, outcome.tone);
    setDiceInput("");
    setDiceHint("");
  };

  return {
    changePhase, exportSave, importSave, clearSession, switchLocale, toggleLessonDone, submitDiceCommand,
  };
}

export type SessionActions = ReturnType<typeof createSessionActions>;
