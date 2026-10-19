import type { ChangeEvent, FormEvent } from "react";
import { createDeviceBackup, MAX_BACKUP_BYTES, parseBackup } from "../../../lib/backup";
import { DICE_MAIDEN_HINT, rollDiceCommand } from "../../../lib/dice";
import { listSceneCardDecks } from "../../../lib/director";
import type { Locale } from "../../../lib/i18n";
import { SKILL_TABLE, uid } from "../../../lib/rules";
import { createInitialGameState } from "../../../lib/session";
import type { Phase } from "../../../lib/session";
import type { ConsoleBase } from "../types";

export function createSessionActions(ctx: ConsoleBase) {
  const {
    addLog, checkpoint, currentState, diceInput, phase, round, selected, characterLibrary, academyDone, locale,
    setAcademyDone, setDiceHint, setDiceInput, setGame, setGmBeat, setGmPressure, setInteropPrivate, setLastRoll,
    setLocale, setPhase, setReplayEnding, setReplayGenre, setReplayHeroId, setReplayIntensity, setReplayLength,
    setReplayMode, setReplayRevealSecrets, setReplaySeed, setTargetId, setTranscriptDraft, setTranscriptQuery,
    setTranscriptSceneId, setTranscriptSpeaker, setTreasureName, setTreasureNote, setTreasureTargets, setView, setCharacterLibrary,
  } = ctx;

  const changePhase = (next: Phase) => {
    if (next === phase) return;
    checkpoint();
    setPhase(next);
    addLog(`团务阶段切换为「${next}阶段」。`, "system");
  };

  const downloadJson = (value: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportSave = () => {
    downloadJson(currentState(), `忍神控制台-第${round}回合.json`);
    addLog("已导出当前团务存档。", "system");
  };

  const exportDeviceBackup = () => {
    downloadJson(createDeviceBackup({ game: currentState(), characterLibrary, academyDone, locale }), `忍神控制台-完整备份-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const exportRawDeviceData = () => {
    try {
      const entries = ctx.readRawDeviceData();
      downloadJson({ format: "shinobigami-recovery-raw", exportedAt: new Date().toISOString(), entries }, "忍神控制台-设备原始数据-供修复.json");
    } catch {
      window.alert("浏览器不允许读取设备存储。请先下载当前页面的完整备份，再检查浏览器的存储设置。");
    }
  };

  const importSave = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    if (file.size > MAX_BACKUP_BYTES) {
      window.alert("存档超过 32 MiB，无法导入。请先在原页面减少立绘或拆分跑团记录，再导出。");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseBackup(JSON.parse(String(reader.result)));
        if (!imported) throw new Error("invalid");
        const message = imported.kind === "device"
          ? `将替换当前会话、角色库（${imported.characterLibrary.length} 个角色）、学习进度与语言偏好。角色库和学习进度不能通过“撤销”恢复。建议先下载完整备份。继续导入？`
          : "将替换当前会话，角色库和学习进度保持不变。建议先导出当前存档。继续导入？";
        if (!window.confirm(message)) return;
        const parsed = imported.game;
        checkpoint();
        if (imported.kind === "device") {
          setCharacterLibrary(imported.characterLibrary);
          setAcademyDone(imported.academyDone);
          setLocale(imported.locale);
        }
        setGame({ ...parsed, logs: [...parsed.logs.slice(-499), { id: uid("log"), round: parsed.round, cycle: parsed.cycle, tone: "system", text: `已导入存档：${file.name}` }] });
        setGmBeat("定调");
        setGmPressure(1);
      } catch {
        window.alert("存档无法读取或版本不受支持，当前数据未更改。请选择本控制台导出的会话存档或完整备份。");
      }
    };
    reader.onerror = () => window.alert("文件读取失败，当前数据未更改。请重新选择文件。");
    reader.readAsText(file);
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
  };

  const toggleLessonDone = (lessonId: string) => {
    setAcademyDone((current) => current.includes(lessonId) ? current.filter((id) => id !== lessonId) : [...current, lessonId]);
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
    changePhase, exportSave, exportDeviceBackup, exportRawDeviceData, importSave, clearSession, switchLocale, toggleLessonDone, submitDiceCommand,
  };
}

export type SessionActions = ReturnType<typeof createSessionActions>;
