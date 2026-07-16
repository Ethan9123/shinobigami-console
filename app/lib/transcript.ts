export type TranscriptEntryKind = "dialogue" | "scene" | "roll" | "system" | "text";

export type TranscriptEntry = {
  id: string;
  line: number;
  sceneId: string;
  speaker: string;
  text: string;
  kind: TranscriptEntryKind;
};

export type TranscriptScene = {
  id: string;
  title: string;
  startLine: number;
  entryCount: number;
};

export type TranscriptArchive = {
  sourceName: string;
  importedAt: string;
  entries: TranscriptEntry[];
  scenes: TranscriptScene[];
  speakers: Array<{ name: string; count: number }>;
  truncated: boolean;
};

const SCENE_HEADING = /^(?:导入阶段|主要阶段|高潮阶段|结束阶段|导入场景\s*[：:]|第[一二三四五六七八九十百\d]+巡|第[一二三四五六七八九十百\d]+场|场景\s*[：:]|场景结束)/;
const ROLL_LINE = /(?:\b\d+D\d+\b|\b\d+SG\b|判定|大成功|大失败|逆凪|骰|掷|擲)/i;
const SYSTEM_LINE = /^(?:GM\s*[：:]|系统\s*[：:]|SYSTEM\s*[：:]|\[.*\])|(?:阶段开始|阶段结束|战斗开始|战斗结束)$/i;

function sceneTitle(line: string) {
  if (line.startsWith("场景结束")) return "场景间幕";
  return line.replace(/\s+/g, " ").slice(0, 80);
}

export function parseTranscript(input: string, sourceName = "粘贴文本", maxEntries = 5000): TranscriptArchive {
  const rawLines = input.replace(/\r/g, "").split("\n");
  const entries: TranscriptEntry[] = [];
  const scenes: TranscriptScene[] = [];
  const speakerCounts = new Map<string, number>();
  let activeSceneId = "scene-0";
  let activeSceneTitle = "未分场记录";
  let activeSceneStart = 1;
  let activeSceneCount = 0;
  let truncated = false;

  const closeScene = () => {
    if (!activeSceneCount) return;
    scenes.push({ id: activeSceneId, title: activeSceneTitle, startLine: activeSceneStart, entryCount: activeSceneCount });
  };

  for (let index = 0; index < rawLines.length; index += 1) {
    const line = rawLines[index].trim();
    if (!line) continue;
    if (entries.length >= maxEntries) {
      truncated = true;
      break;
    }

    if (SCENE_HEADING.test(line)) {
      closeScene();
      activeSceneId = `scene-${scenes.length + 1}`;
      activeSceneTitle = sceneTitle(line);
      activeSceneStart = index + 1;
      activeSceneCount = 0;
      entries.push({ id: `line-${index + 1}`, line: index + 1, sceneId: activeSceneId, speaker: "", text: line, kind: "scene" });
      activeSceneCount += 1;
      continue;
    }

    const dialogue = line.match(/^<([^>]{1,48})>\s*(.*)$/);
    const speaker = dialogue?.[1]?.trim() ?? "";
    const text = dialogue?.[2]?.trim() || line;
    if (speaker) speakerCounts.set(speaker, (speakerCounts.get(speaker) ?? 0) + 1);
    const kind: TranscriptEntryKind = speaker ? "dialogue" : ROLL_LINE.test(line) ? "roll" : SYSTEM_LINE.test(line) ? "system" : "text";
    entries.push({ id: `line-${index + 1}`, line: index + 1, sceneId: activeSceneId, speaker, text, kind });
    activeSceneCount += 1;
  }
  closeScene();

  return {
    sourceName,
    importedAt: new Date().toISOString(),
    entries,
    scenes,
    speakers: [...speakerCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN")),
    truncated,
  };
}

export function normalizeTranscriptArchive(value: unknown): TranscriptArchive | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Partial<TranscriptArchive>;
  if (!Array.isArray(raw.entries) || !Array.isArray(raw.scenes)) return null;
  const entries = raw.entries.slice(0, 5000).filter((entry): entry is TranscriptEntry => (
    Boolean(entry && typeof entry.id === "string" && typeof entry.text === "string" && typeof entry.sceneId === "string")
  ));
  if (!entries.length) return null;
  return {
    sourceName: typeof raw.sourceName === "string" ? raw.sourceName : "导入记录",
    importedAt: typeof raw.importedAt === "string" ? raw.importedAt : "",
    entries,
    scenes: raw.scenes.filter((scene): scene is TranscriptScene => Boolean(scene && typeof scene.id === "string" && typeof scene.title === "string")),
    speakers: Array.isArray(raw.speakers) ? raw.speakers.filter((speaker): speaker is { name: string; count: number } => Boolean(speaker && typeof speaker.name === "string" && typeof speaker.count === "number")) : [],
    truncated: raw.truncated === true,
  };
}
