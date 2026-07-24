import type { Character, Emotion, IntelRecord, SceneAction, SceneCue, Tracker } from "./session";

export const GM_BEATS = ["定调", "聚焦", "抉择", "余波"] as const;
export type GmBeat = (typeof GM_BEATS)[number];
export type GmPressure = 0 | 1 | 2 | 3;

export type GmDirectorInput = {
  title: string;
  cycle: number;
  sceneNumber: number;
  sceneOwnerId: string;
  sceneParticipantIds: string[];
  sceneAction: SceneAction;
  characters: Character[];
  emotions: Emotion[];
  intel: IntelRecord[];
  trackers: Tracker[];
  cues: SceneCue[];
  beat: GmBeat;
  pressure: GmPressure;
  tableSafe: boolean;
};

export type GmBrief = {
  spotlight: { id: string; name: string; reason: string };
  tension: number;
  tensionLabel: "余裕" | "暗流" | "迫近" | "临界";
  pressureLabel: "留白" | "牵引" | "施压" | "逼近高潮";
  suggestedAction: Exclude<SceneAction, "未定">;
  headline: string;
  objective: string;
  readAloud: string;
  playerQuestion: string;
  success: string;
  failure: string;
  complication: string;
  nextStep: string;
  privateCue: string;
  diagnostics: Array<{ label: string; value: string; tone: "good" | "warn" | "danger" }>;
};

const ACTION_GUIDES: Record<Exclude<SceneAction, "未定">, {
  objective: string;
  question: string;
  success: string;
  failure: string;
}> = {
  回复判定: {
    objective: "让角色决定自己要保住什么，再把恢复与代价放进同一个画面。",
    question: "你暂时停下来时，最不愿让同伴看见的疲惫是什么？",
    success: "角色赢得喘息，并能主动决定下一幕从哪里重新出发。",
    failure: "恢复目标仍然推进，但暴露位置、欠下人情或让事件时钟前进一格。",
  },
  情报判定: {
    objective: "给出能够改变下一步选择的线索，而不是只给背景知识。",
    question: "如果只能确认一件事，你现在最想知道谁在说谎、哪里危险，还是目标去了哪里？",
    success: "给出明确线索、可行动方向，以及它为什么值得现在就追。",
    failure: "仍给出核心线索，但同时附带误导性的第二方向、暴露调查者或让对手先一步行动。",
  },
  感情判定: {
    objective: "用一次具体交流定义关系，让之后的修正有可回忆的情感依据。",
    question: "对方做了什么微小举动，让你决定更靠近他，或从此无法信任他？",
    success: "由玩家描述关系改变的瞬间，并明确正面或负面感情。",
    failure: "关系依然改变，但第三者误会、承诺带有条件，或真正想说的话没有说出口。",
  },
  战斗: {
    objective: "让战斗改变局势，而不只是交换伤害；开打前先说清退出条件。",
    question: "你要击倒对方、拖住对方、抢走目标，还是逼他说出一句真话？",
    success: "行动者取得自己声明的战术目标，并决定是否把冲突继续升级。",
    failure: "目标没有消失；行动者仍换来位置或情报，但承受伤害、变调或失去主动权。",
  },
  计划判定: {
    objective: "把抽象计划落成一个看得见的优势、入口或时机。",
    question: "计划成功时，下一幕里哪一件原本不可能的事会变得可行？",
    success: "记录一个具体可调用的优势，并说明它在哪个时机失效。",
    failure: "计划仍创造机会，但对手察觉痕迹、代价提高，或优势只能使用一次。",
  },
  辅助判定: {
    objective: "让支援者改变他人的选择空间，而不是替对方抢走主角位置。",
    question: "你做了什么，让场景玩家敢于采取原本不会选的做法？",
    success: "明确支援带来的机会，并把最后决定交还给场景玩家。",
    failure: "帮助仍然抵达，但支援者也被卷入风险，或必须公开自己的立场。",
  },
};

const COMPLICATIONS = [
  "对手没有阻止行动，而是在现场留下一个只能立刻二选一的诱饵。",
  "一个无辜者被卷入；继续追击仍然可行，但必须先决定是否保护他。",
  "线索是真的，却指向两个互相冲突的解释；请玩家决定先相信哪一个。",
  "场所不再安全。角色能完成眼前目标，但下一幕必须换地点或暴露行踪。",
  "一名 NPC 提出带条件的帮助：现在接受会更快，之后却必须偿还。",
  "旧关系突然介入。让一名未登场角色听见、看见或误解眼前的一部分。",
];

function hash(text: string) {
  let value = 2166136261;
  for (const character of text) {
    value ^= character.codePointAt(0) ?? 0;
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function aliveLife(character: Character) {
  return Object.values(character.life).filter(Boolean).length + character.extraLife;
}

function chooseSpotlight(input: GmDirectorInput) {
  const pcs = input.characters.filter((character) => character.role === "PC" && character.active);
  const owner = pcs.find((character) => character.id === input.sceneOwnerId);
  const waiting = pcs.filter((character) => !character.acted);
  const spotlight = owner && (!owner.acted || !waiting.length) ? owner : waiting[0] ?? owner ?? pcs[0] ?? input.characters[0];
  const reason = spotlight?.id === owner?.id
    ? owner.acted ? "本巡人人都已行动，继续围绕当前场景玩家收束。" : "当前场景玩家尚未行动，应把决定权留给他。"
    : waiting.length ? "当前场景玩家已经行动，优先把镜头交给仍在等待的人。" : "维持当前主角，尽快完成本巡收束。";
  return { id: spotlight?.id ?? "", name: spotlight?.name ?? "场景玩家", reason };
}

function suggestAction(input: GmDirectorInput, spotlightId: string): Exclude<SceneAction, "未定"> {
  const spotlight = input.characters.find((character) => character.id === spotlightId);
  if (spotlight && aliveLife(spotlight) <= 3) return "回复判定";
  const hasIntel = input.intel.some((record) => record.knownBy.includes(spotlightId));
  if (!hasIntel) return "情报判定";
  const hasEmotion = input.emotions.some((emotion) => emotion.fromId === spotlightId || emotion.toId === spotlightId);
  if (!hasEmotion) return "感情判定";
  const clockRatio = Math.max(0, ...input.trackers.map((tracker) => tracker.max ? tracker.value / tracker.max : 0));
  if (clockRatio >= .72 && input.characters.some((character) => character.role === "NPC" && character.active)) return "战斗";
  return "计划判定";
}

function calculateTension(input: GmDirectorInput) {
  const clockRatio = Math.max(0, ...input.trackers.map((tracker) => tracker.max ? tracker.value / tracker.max : 0));
  const dueCount = input.cues.filter((cue) => !cue.done && (cue.cycle < input.cycle || (cue.cycle === input.cycle && cue.scene <= input.sceneNumber))).length;
  const actionHeat = input.sceneAction === "战斗" ? 14 : input.sceneAction === "未定" ? 0 : 5;
  return clamp(Math.round(12 + input.cycle * 7 + input.sceneNumber * 3 + input.pressure * 12 + clockRatio * 30 + dueCount * 8 + actionHeat), 8, 100);
}

function tensionLabel(tension: number): GmBrief["tensionLabel"] {
  if (tension >= 82) return "临界";
  if (tension >= 62) return "迫近";
  if (tension >= 38) return "暗流";
  return "余裕";
}

function pressureLabel(pressure: GmPressure): GmBrief["pressureLabel"] {
  return ["留白", "牵引", "施压", "逼近高潮"][pressure] as GmBrief["pressureLabel"];
}

function readAloud(input: GmDirectorInput, spotlight: string, action: Exclude<SceneAction, "未定">) {
  const participants = input.characters
    .filter((character) => input.sceneParticipantIds.includes(character.id) && character.name !== spotlight)
    .map((character) => character.name);
  const company = participants.length ? `，${participants.join("、")}也在场` : "";
  const title = input.title.trim() || "这次忍务";
  if (input.beat === "定调") return `镜头回到《${title}》。周围有一个细节与刚才不同，却没人能立刻说出它意味着什么。${spotlight}${company}，现在先由你描述：此刻最先注意到的是什么？`;
  if (input.beat === "聚焦") return `${spotlight}，局势正把你的使命推到眼前。先别急着投骰：告诉大家你想改变什么，以及谁会因此受到影响。`;
  if (input.beat === "抉择") return `${action}即将决定局势。成功会给你明确的主动权；失败也不会让故事停下，只会让代价进入场景。${spotlight}，你接受这个风险吗？`;
  return `画面在结果最清楚的瞬间停住。${spotlight}，请用一句话说出你因此改变了什么；其他人各自保留一个尚未说出口的反应。`;
}

export function createGmBrief(input: GmDirectorInput): GmBrief {
  const spotlight = chooseSpotlight(input);
  const suggestedAction = suggestAction(input, spotlight.id);
  const action = input.sceneAction === "未定" ? suggestedAction : input.sceneAction;
  const guide = ACTION_GUIDES[action];
  const tension = calculateTension(input);
  const due = input.cues.filter((cue) => !cue.done && (cue.cycle < input.cycle || (cue.cycle === input.cycle && cue.scene <= input.sceneNumber)));
  const seed = `${input.title}:${input.cycle}:${input.sceneNumber}:${spotlight.id}:${input.pressure}:${action}`;
  const complication = COMPLICATIONS[hash(seed) % COMPLICATIONS.length];
  const knownIntel = input.intel.filter((record) => record.knownBy.length).length;
  const totalIntel = Math.max(1, input.characters.length * 3);
  const pcCount = input.characters.filter((character) => character.role === "PC").length;
  const actedCount = input.characters.filter((character) => character.role === "PC" && character.acted).length;
  const clock = input.trackers
    .slice()
    .sort((a, b) => (b.max ? b.value / b.max : 0) - (a.max ? a.value / a.max : 0))[0];
  const beatIndex = GM_BEATS.indexOf(input.beat);
  const nextStep = beatIndex < GM_BEATS.length - 1
    ? `确认玩家回应后，推进到「${GM_BEATS[beatIndex + 1]}」。`
    : "记录余波，完成场景并把镜头交给下一位尚未行动的 PC。";

  return {
    spotlight,
    tension,
    tensionLabel: tensionLabel(tension),
    pressureLabel: pressureLabel(input.pressure),
    suggestedAction,
    headline: input.beat === "定调" ? "先给画面，再把问题交给玩家"
      : input.beat === "聚焦" ? "把使命压到眼前，但不替玩家选择"
        : input.beat === "抉择" ? "投骰前公开得失，失败也要向前"
          : "让结果留下痕迹，在最有力的瞬间切幕",
    objective: guide.objective,
    readAloud: readAloud(input, spotlight.name, action),
    playerQuestion: guide.question,
    success: guide.success,
    failure: guide.failure,
    complication,
    nextStep,
    privateCue: due.length
      ? input.tableSafe ? `${due.length} 个主持事件已经到点；切回 GM 视图查看内容。` : `已到点：${due.map((cue) => cue.title).join("、")}`
      : "当前没有到点的主持事件。",
    diagnostics: [
      { label: "聚光灯", value: `${actedCount}/${pcCount || 1} 位 PC 已行动`, tone: actedCount < pcCount ? "warn" : "good" },
      { label: "事件时钟", value: clock ? `${clock.name} ${clock.value}/${clock.max}` : "尚未设置", tone: clock && clock.max && clock.value / clock.max >= .75 ? "danger" : "good" },
      { label: "情报可见度", value: `${knownIntel}/${totalIntel} 条潜在线索已流动`, tone: knownIntel ? "good" : "warn" },
    ],
  };
}

export function composeGmNote(brief: GmBrief, kind: "opening" | "question" | "failure" | "aftermath") {
  if (kind === "opening") return `【场景开场】${brief.readAloud}`;
  if (kind === "question") return `【问玩家】${brief.playerQuestion}`;
  if (kind === "failure") return `【失败也前进】${brief.failure} 建议的剧情代价：${brief.complication}`;
  return `【场景余波】请记录谁得到了什么、付出了什么，以及下一幕必须回应的问题。`;
}
