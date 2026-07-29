import { FIELD_NAMES, makeLife, uid } from "./rules";
import type { BackgroundItem, BuildRequirements, FieldName, Ninpo } from "./rules";
import { createIdleTutorialState, normalizeTutorialState } from "./tutorial";
import type { TutorialState } from "./tutorial";
import { normalizeTranscriptArchive } from "./transcript";
import type { TranscriptArchive } from "./transcript";
import { normalizeGeneratedReplay } from "./replay";
import type { GeneratedReplay } from "./replay";

export type Character = {
  id: string;
  name: string;
  role: "PC" | "NPC";
  faction: string;
  subFaction?: string;
  condition?: string;
  style?: string;
  rank: string;
  player?: string;
  age?: string;
  gender?: string;
  cover?: string;
  belief?: string;
  merit?: number;
  enemy?: string;
  surface?: string;
  story?: string;
  backgrounds?: string;
  backgroundItems: BackgroundItem[];
  portrait?: string;
  ougiSkill?: string;
  ougiEffect?: string;
  ougiStrength?: string;
  ougiWeakness?: string;
  plot: number | null;
  active: boolean;
  extraLife: number;
  life: Record<FieldName, boolean>;
  skills: string[];
  ninpoIds: string[];
  conditions: string[];
  spentCost: number;
  usedNinpoIds: string[];
  mission: string;
  secret: string;
  ougi: string;
  closedGaps: boolean[];
  acted: boolean;
  tools: Record<"兵粮丸" | "神通丸" | "遁甲符", number>;
};

export type Emotion = { id: string; fromId: string; toId: string; label: string; positive: boolean; used: boolean };
export type Treasure = { id: string; name: string; holderId: string; note: string };
export type IntelKind = "秘密" | "居所" | "奥义";
export type IntelRecord = { subjectId: string; kind: IntelKind; knownBy: string[] };
export type SceneAction = "未定" | "回复判定" | "情报判定" | "感情判定" | "战斗" | "计划判定" | "辅助判定";
export type SceneCue = { id: string; title: string; cycle: number; scene: number; done: boolean };
export type Tracker = { id: string; name: string; value: number; max: number };
export type LogEntry = { id: string; round: number; cycle?: number; tone: "system" | "roll" | "action" | "danger"; text: string };
export type Phase = "导入" | "主要" | "高潮";

export type SessionBrief = {
  title: string;
  regulation: string;
  scenarioType: string;
  playerCount: number;
  cycles: number;
  rank: string;
  characterMode: "新卡" | "续卡" | "混合";
  gmDifficulty: string;
  allowedRules: string;
  submissionDeadline: string;
  requirements: BuildRequirements;
};

export type Handout = {
  id: string;
  slot: string;
  assignedCharacterId: string;
  publicMission: string;
  privateSecret: string;
  recommendedFaction: string;
  delivered: boolean;
  reviewed: boolean;
  questionsResolved: boolean;
};

export type ResolutionStage = "命中判定" | "反应窗口" | "回避判定" | "效果结算" | "完成";
export type Resolution = {
  id: string;
  actorId: string;
  targetId: string;
  ninpoId: string;
  ninpoName: string;
  ninpoKind: Ninpo["kind"];
  skill: string;
  stage: ResolutionStage;
  attackOutcome?: string;
  defenseOutcome?: string;
};

export function advanceResolutionAfterRoll(resolution: Resolution, rollerId: string, outcome: string): Resolution {
  if (resolution.stage === "命中判定" && resolution.actorId === rollerId) {
    return { ...resolution, attackOutcome: outcome, stage: outcome.includes("失败") ? "完成" : "反应窗口" };
  }
  if (resolution.stage === "回避判定" && resolution.targetId === rollerId) {
    return { ...resolution, defenseOutcome: outcome, stage: outcome.includes("失败") ? "效果结算" : "完成" };
  }
  return resolution;
}

export type GameState = {
  schemaVersion: 8;
  characters: Character[];
  selectedId: string;
  round: number;
  revealed: boolean;
  logs: LogEntry[];
  phase: Phase;
  turnIndex: number;
  customNinpo: Ninpo[];
  cycle: number;
  sceneNumber: number;
  sceneOwnerId: string;
  sceneParticipantIds: string[];
  sceneAction: SceneAction;
  sceneNote: string;
  emotions: Emotion[];
  intel: IntelRecord[];
  cues: SceneCue[];
  trackers: Tracker[];
  treasures: Treasure[];
  brief: SessionBrief;
  handouts: Handout[];
  resolution: Resolution | null;
  tutorial: TutorialState;
  transcript: TranscriptArchive | null;
  replay: GeneratedReplay | null;
};

const DEFAULT_REQUIREMENTS: BuildRequirements = { requiredSkills: 6, requiredNinpoSlots: 4, requiredTools: 2 };

export const starterLogs: LogEntry[] = [
  { id: "welcome", round: 1, tone: "system", text: "控制台已就绪。先完成开团检查，再进入主要阶段。" },
];

export function createDefaultBrief(playerCount = 2): SessionBrief {
  return {
    title: "未命名忍务",
    regulation: "现代篇",
    scenarioType: "特殊型",
    playerCount,
    cycles: 3,
    rank: "中忍",
    characterMode: "新卡",
    gmDifficulty: "中",
    allowedRules: "基本规则；其他扩展由 GM 确认",
    submissionDeadline: "",
    requirements: { ...DEFAULT_REQUIREMENTS },
  };
}

export function makeDefaultHandouts(characters: Character[], playerCount = characters.filter((item) => item.role === "PC").length): Handout[] {
  const pcs = characters.filter((character) => character.role === "PC");
  return Array.from({ length: Math.max(1, playerCount) }, (_, index) => {
    const character = pcs[index];
    return {
      id: `handout-pc${index + 1}`,
      slot: `PC${index + 1}`,
      assignedCharacterId: character?.id ?? "",
      publicMission: character?.mission ?? "",
      privateSecret: character?.secret ?? "",
      recommendedFaction: "",
      delivered: false,
      reviewed: false,
      questionsResolved: false,
    };
  });
}

export function createInitialGameState(): GameState {
  const characters: Character[] = [
    {
      id: "pc-tsukikage", name: "月影", role: "PC", faction: "鞍马神流", rank: "中忍", backgroundItems: [], plot: null, active: true,
      extraLife: 0, life: makeLife(), skills: ["刀术", "走法", "见敌术", "潜伏术", "意气", "第六感"],
      ninpoIds: ["close", "cross", "shoot", "kamaitachi", "blast"], conditions: [], spentCost: 0, usedNinpoIds: [],
      mission: "守住目标，并查明敌人的秘密。", secret: "尚未公开的个人秘密。", ougi: "月下无影", closedGaps: [false, true, false, false, false], acted: false,
      tools: { 兵粮丸: 0, 神通丸: 1, 遁甲符: 1 },
    },
    {
      id: "npc-kirikage", name: "雾隐", role: "NPC", faction: "隐忍血统", rank: "中忍", backgroundItems: [], plot: null, active: true,
      extraLife: 0, life: makeLife(), skills: ["毒术", "潜伏术", "咒术", "异形化", "身体操术", "调查术"],
      ninpoIds: ["close", "poison", "shoot", "blast", "kamaitachi"], conditions: [], spentCost: 0, usedNinpoIds: [],
      mission: "击败妨碍计划的忍者。", secret: "真正的目的仍被迷雾掩盖。", ougi: "百毒夜行", closedGaps: [false, false, false, false, true], acted: false,
      tools: { 兵粮丸: 1, 神通丸: 1, 遁甲符: 0 },
    },
  ];
  const brief = createDefaultBrief(1);
  return {
    schemaVersion: 8,
    characters,
    selectedId: characters[0].id,
    round: 1,
    revealed: false,
    logs: starterLogs.map((entry) => ({ ...entry })),
    phase: "导入",
    turnIndex: 0,
    customNinpo: [],
    cycle: 1,
    sceneNumber: 1,
    sceneOwnerId: characters[0].id,
    sceneParticipantIds: [characters[0].id],
    sceneAction: "未定",
    sceneNote: "",
    emotions: [],
    intel: [],
    cues: [],
    trackers: [{ id: "tracker-clue", name: "线索进度", value: 0, max: 6 }],
    treasures: [],
    brief,
    handouts: makeDefaultHandouts(characters, brief.playerCount),
    resolution: null,
    tutorial: createIdleTutorialState(),
    transcript: null,
    replay: null,
  };
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, Math.floor(parsed))) : fallback;
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeBackgroundItems(value: unknown): BackgroundItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index): BackgroundItem[] => {
    const item = record(entry);
    const name = text(item.name);
    if (!name) return [];
    return [{
      id: text(item.id) || `bg-${index + 1}`,
      serial: text(item.serial),
      name,
      category: text(item.category),
      points: number(item.points, 0, -999, 999),
      effect: text(item.effect),
    }];
  });
}

function normalizeCharacter(value: unknown, index: number): Character {
  const raw = record(value);
  const lifeRaw = record(raw.life);
  const toolsRaw = record(raw.tools);
  const baseLife = makeLife();
  for (const field of FIELD_NAMES) {
    if (typeof lifeRaw[field] === "boolean") baseLife[field] = lifeRaw[field] as boolean;
  }
  const role = raw.role === "NPC" ? "NPC" : "PC";
  return {
    id: text(raw.id) || uid(role.toLowerCase()),
    name: text(raw.name, `${role} ${index + 1}`),
    role,
    faction: text(raw.faction, "未选择流派"),
    subFaction: text(raw.subFaction),
    condition: text(raw.condition),
    style: text(raw.style),
    rank: text(raw.rank, "中忍"),
    player: text(raw.player),
    age: text(raw.age),
    gender: text(raw.gender),
    cover: text(raw.cover),
    belief: text(raw.belief),
    merit: number(raw.merit, 0, -999, 999),
    enemy: text(raw.enemy),
    surface: text(raw.surface),
    story: text(raw.story),
    backgrounds: text(raw.backgrounds),
    backgroundItems: normalizeBackgroundItems(raw.backgroundItems),
    portrait: text(raw.portrait),
    ougiSkill: text(raw.ougiSkill),
    ougiEffect: text(raw.ougiEffect),
    ougiStrength: text(raw.ougiStrength),
    ougiWeakness: text(raw.ougiWeakness),
    plot: raw.plot == null ? null : number(raw.plot, 1, 1, 6),
    active: raw.active !== false,
    extraLife: number(raw.extraLife, 0, 0, 99),
    life: baseLife,
    skills: stringList(raw.skills),
    ninpoIds: stringList(raw.ninpoIds).filter((id) => id !== "emotion"),
    conditions: stringList(raw.conditions).map((condition) => condition === "失忆" ? "忘却" : condition),
    spentCost: number(raw.spentCost, 0, 0, 99),
    usedNinpoIds: stringList(raw.usedNinpoIds),
    mission: text(raw.mission),
    secret: text(raw.secret),
    ougi: text(raw.ougi),
    closedGaps: Array.from({ length: 5 }, (_, gap) => Array.isArray(raw.closedGaps) && raw.closedGaps[gap] === true),
    acted: raw.acted === true,
    tools: {
      兵粮丸: number(toolsRaw.兵粮丸, 0, 0, 99),
      神通丸: number(toolsRaw.神通丸, 0, 0, 99),
      遁甲符: number(toolsRaw.遁甲符, 0, 0, 99),
    },
  };
}

export function normalizeGameState(value: unknown): GameState | null {
  const raw = record(value);
  if (!Array.isArray(raw.characters) || !raw.characters.length) return null;
  const characters = raw.characters.map(normalizeCharacter);
  const ids = new Set(characters.map((character) => character.id));
  const pcs = characters.filter((character) => character.role === "PC");
  const baseBrief = createDefaultBrief(Math.max(1, pcs.length));
  const briefRaw = record(raw.brief);
  const requirementsRaw = record(briefRaw.requirements);
  const characterMode = ["新卡", "续卡", "混合"].includes(text(briefRaw.characterMode))
    ? text(briefRaw.characterMode) as SessionBrief["characterMode"]
    : baseBrief.characterMode;
  const brief: SessionBrief = {
    title: text(briefRaw.title, baseBrief.title),
    regulation: text(briefRaw.regulation, baseBrief.regulation),
    scenarioType: text(briefRaw.scenarioType, baseBrief.scenarioType),
    playerCount: number(briefRaw.playerCount, baseBrief.playerCount, 1, 12),
    cycles: number(briefRaw.cycles, baseBrief.cycles, 1, 20),
    rank: text(briefRaw.rank, baseBrief.rank),
    characterMode,
    gmDifficulty: text(briefRaw.gmDifficulty, baseBrief.gmDifficulty),
    allowedRules: text(briefRaw.allowedRules, baseBrief.allowedRules),
    submissionDeadline: text(briefRaw.submissionDeadline),
    requirements: {
      requiredSkills: number(requirementsRaw.requiredSkills, baseBrief.requirements.requiredSkills, 0, 30),
      requiredNinpoSlots: number(requirementsRaw.requiredNinpoSlots, baseBrief.requirements.requiredNinpoSlots, 0, 30),
      requiredTools: number(requirementsRaw.requiredTools, baseBrief.requirements.requiredTools, 0, 30),
    },
  };

  const fallbackHandouts = makeDefaultHandouts(characters, brief.playerCount);
  const handouts = Array.isArray(raw.handouts)
    ? raw.handouts.map((value, index): Handout => {
      const item = record(value);
      return {
        id: text(item.id) || `handout-${index + 1}`,
        slot: text(item.slot, `PC${index + 1}`),
        assignedCharacterId: ids.has(text(item.assignedCharacterId)) ? text(item.assignedCharacterId) : "",
        publicMission: text(item.publicMission),
        privateSecret: text(item.privateSecret),
        recommendedFaction: text(item.recommendedFaction),
        delivered: item.delivered === true,
        reviewed: item.reviewed === true,
        questionsResolved: item.questionsResolved === true,
      };
    })
    : fallbackHandouts;

  const sceneActions: SceneAction[] = ["未定", "回复判定", "情报判定", "感情判定", "战斗", "计划判定", "辅助判定"];
  const phases: Phase[] = ["导入", "主要", "高潮"];
  const resolutionRaw = record(raw.resolution);
  const stages: ResolutionStage[] = ["命中判定", "反应窗口", "回避判定", "效果结算", "完成"];
  const resolution = ids.has(text(resolutionRaw.actorId)) && ids.has(text(resolutionRaw.targetId)) && stages.includes(text(resolutionRaw.stage) as ResolutionStage)
    ? {
      id: text(resolutionRaw.id) || uid("resolution"),
      actorId: text(resolutionRaw.actorId),
      targetId: text(resolutionRaw.targetId),
      ninpoId: text(resolutionRaw.ninpoId),
      ninpoName: text(resolutionRaw.ninpoName, "未命名忍法"),
      ninpoKind: (["攻击", "支援", "装备"].includes(text(resolutionRaw.ninpoKind)) ? text(resolutionRaw.ninpoKind) : "攻击") as Ninpo["kind"],
      skill: text(resolutionRaw.skill, "自由"),
      stage: text(resolutionRaw.stage) as ResolutionStage,
      attackOutcome: text(resolutionRaw.attackOutcome) || undefined,
      defenseOutcome: text(resolutionRaw.defenseOutcome) || undefined,
    }
    : null;

  const selectedId = ids.has(text(raw.selectedId)) ? text(raw.selectedId) : characters[0].id;
  const firstPcId = pcs[0]?.id ?? characters[0].id;
  return {
    schemaVersion: 8,
    characters,
    selectedId,
    round: number(raw.round, 1, 1, 999),
    revealed: raw.revealed === true,
    logs: (Array.isArray(raw.logs) ? raw.logs : starterLogs).slice(-500).map((value, index): LogEntry => {
      const item = record(value);
      const tone = ["system", "roll", "action", "danger"].includes(text(item.tone)) ? text(item.tone) as LogEntry["tone"] : "system";
      return { id: text(item.id) || `log-${index}`, round: number(item.round, 1, 1, 999), cycle: item.cycle == null ? undefined : number(item.cycle, 1, 1, 999), tone, text: text(item.text) };
    }),
    phase: phases.includes(text(raw.phase) as Phase) ? text(raw.phase) as Phase : "主要",
    turnIndex: number(raw.turnIndex, 0, 0, 999),
    customNinpo: Array.isArray(raw.customNinpo) ? raw.customNinpo as Ninpo[] : [],
    cycle: number(raw.cycle, 1, 1, 999),
    sceneNumber: number(raw.sceneNumber, 1, 1, 999),
    sceneOwnerId: ids.has(text(raw.sceneOwnerId)) ? text(raw.sceneOwnerId) : firstPcId,
    sceneParticipantIds: stringList(raw.sceneParticipantIds).filter((id) => ids.has(id)),
    sceneAction: sceneActions.includes(text(raw.sceneAction) as SceneAction) ? text(raw.sceneAction) as SceneAction : "未定",
    sceneNote: text(raw.sceneNote),
    emotions: Array.isArray(raw.emotions) ? raw.emotions as Emotion[] : [],
    intel: Array.isArray(raw.intel) ? raw.intel as IntelRecord[] : [],
    cues: Array.isArray(raw.cues) ? raw.cues as SceneCue[] : [],
    trackers: Array.isArray(raw.trackers) && raw.trackers.length ? raw.trackers as Tracker[] : [{ id: "tracker-clue", name: "线索进度", value: 0, max: 6 }],
    treasures: Array.isArray(raw.treasures)
      ? raw.treasures.flatMap((value, index): Treasure[] => {
        const item = record(value);
        const name = text(item.name);
        if (!name) return [];
        const holderId = text(item.holderId);
        return [{
          id: text(item.id) || `treasure-${index + 1}`,
          name,
          holderId: ids.has(holderId) ? holderId : "",
          note: text(item.note),
        }];
      })
      : [],
    brief,
    handouts,
    resolution,
    tutorial: normalizeTutorialState(raw.tutorial),
    transcript: normalizeTranscriptArchive(raw.transcript),
    replay: normalizeGeneratedReplay(raw.replay),
  };
}
