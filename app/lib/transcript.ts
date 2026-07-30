export type TranscriptEntryKind = "dialogue" | "scene" | "roll" | "system" | "action" | "text";

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

const SCENE_HEADING = /^(?:导入阶段|主要阶段|高潮阶段|结束阶段|导入场景\s*[：:]|回想场景|结局场景|主持人场景\s*[：:]|后日谈\s*[：:]|尾声\s*[：:]|第[一二三四五六七八九十百\d]+循环(?:[\s，,、]*第[一二三四五六七八九十百\d]+场景)?|第[一二三四五六七八九十百\d]+巡|第[一二三四五六七八九十百\d]+场|场景\s*[：:]|场景结束)/;
const ROLL_LINE = /(?:\b\d+D\d+\b|\b\d+SG\b|判定|大成功|大失败|逆凪|逆止|骰|掷|擲)/i;
// 骰点指令回显：2D6 (2D6) ＞ 8[2,6] ＞ 8、ET 感情表(2) ＞ …… 等，全角＞与半角>均可
const ROLL_COMMAND = /^(?:\d+D\d+(?:[+\-＋－]\d+)*|D66|ET|FT|WT|RTT)(?![0-9A-Za-z]).*[＞>]/i;
const SYSTEM_LINE = /^(?:GM\s*[：:]|系统\s*[：:]|SYSTEM\s*[：:]|\[.*\])|(?:阶段开始|阶段结束|战斗开始|战斗结束)$/i;
// 「剧透 - :」折叠标记：归为 system，不开新场景
const SPOILER_LINE = /^剧透\s*[-－—]+\s*[：:]/;
// Replay 生成器的元信息行（张力：…｜类型：… / 类型：…｜篇幅：…）：归为 system，不计入发言人
const REPLAY_META = /^(?:张力|类型)\s*[：:]/;
// [main]/[閒聊] 等频道前缀：括号内无空格且不超过 8 字符，以区别于「[ 角色名 ] HP : 20 → 19」状态行
const CHANNEL_PREFIX = /^[\[［]([^\[\]［］\s：:→]{1,8})[\]］]\s*/;
const LEGACY_DIALOGUE = /^<([^>]{1,48})>\s*(.*)$/;
// 名字段 1~24 字符、不含冒号；半角/全角冒号两侧允许空格（JS 的 \s 含全角空格 　）
const COLON_DIALOGUE = /^([^：:\[\]［］<>＜＞→]{1,24}?)\s*[：:]\s*(.*)$/;
const ACTION_PREFIX = /^(?:宣言|使用|选择|解放|登场|脱落|结束场景|场景结束)/;
const SYSTEM_SPEAKER = /^(?:system|系统)$/i;

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
    const line = rawLines[index].trim(); // trim 覆盖全角空格
    if (!line) continue;
    if (entries.length >= maxEntries) {
      truncated = true;
      break;
    }

    let body = line;
    const channel = body.match(CHANNEL_PREFIX);
    // 含「→」的余下部分是状态变更行，方括号内是角色名而非频道，保留原文
    if (channel && channel[0].length < body.length && !body.slice(channel[0].length).includes("→")) body = body.slice(channel[0].length).trim();

    if (SPOILER_LINE.test(body)) {
      entries.push({ id: `line-${index + 1}`, line: index + 1, sceneId: activeSceneId, speaker: "", text: body, kind: "system" });
      activeSceneCount += 1;
      continue;
    }

    if (SCENE_HEADING.test(body)) {
      closeScene();
      activeSceneId = `scene-${scenes.length + 1}`;
      activeSceneTitle = sceneTitle(body);
      activeSceneStart = index + 1;
      activeSceneCount = 0;
      entries.push({ id: `line-${index + 1}`, line: index + 1, sceneId: activeSceneId, speaker: "", text: body, kind: "scene" });
      activeSceneCount += 1;
      continue;
    }

    if (REPLAY_META.test(body)) {
      entries.push({ id: `line-${index + 1}`, line: index + 1, sceneId: activeSceneId, speaker: "", text: body, kind: "system" });
      activeSceneCount += 1;
      continue;
    }

    const dialogue = body.match(LEGACY_DIALOGUE) ?? body.match(COLON_DIALOGUE);
    const speaker = dialogue?.[1]?.trim() ?? "";
    const text = dialogue?.[2]?.trim() || body;
    const systemSpeaker = SYSTEM_SPEAKER.test(speaker);
    if (speaker && !systemSpeaker) speakerCounts.set(speaker, (speakerCounts.get(speaker) ?? 0) + 1);
    let kind: TranscriptEntryKind;
    if (text.includes("→") || systemSpeaker) kind = "system";
    else if (ROLL_COMMAND.test(text) || (!speaker && ROLL_LINE.test(text))) kind = "roll";
    else if (speaker) kind = ACTION_PREFIX.test(text) ? "action" : "dialogue";
    else kind = SYSTEM_LINE.test(body) ? "system" : "text";
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
