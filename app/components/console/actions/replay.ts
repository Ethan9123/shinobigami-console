import { generateReplay } from "../../../lib/replay";
import { parseTranscript } from "../../../lib/transcript";
import type { ConsoleBase } from "../types";

export function createReplayActions(ctx: ConsoleBase) {
  const {
    addLog, brief, characters, checkpoint, replay, replayCast, replayEnding, replayGenre, replayHeroId,
    replayIntensity, replayLength, replayMode, replayRevealSecrets, replaySeed, setReplay, setReplayHeroId,
    setReplaySeed, setTranscript, setTranscriptQuery, setTranscriptSceneId, setTranscriptSpeaker, setView, tableSafe,
  } = ctx;

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

  return {
    createReplay, rerollReplay, exportReplay, sendReplayToDesk,
  };
}

export type ReplayActions = ReturnType<typeof createReplayActions>;
