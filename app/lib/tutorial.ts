import type { Character } from "./session";

export const TUTORIAL_SCHEMA_VERSION = 1 as const;

export type TutorialStatus = "off" | "running" | "complete";
export type TutorialOutcome = "success" | "failure" | "critical" | "fumble";
export type TutorialHintMode = "full" | "compact";
export type TutorialSafetyTone = "gentle" | "balanced" | "dramatic";

export type TutorialRoll = {
  key: string;
  dice: [number, number];
  total: number;
  target: number;
  outcome: TutorialOutcome;
};

export type TutorialSafety = {
  tone: TutorialSafetyTone;
  lines: string[];
  veils: string[];
  confirmed: boolean;
  paused: boolean;
};

export type TutorialState = {
  schemaVersion: 1;
  status: TutorialStatus;
  scenarioId: string | null;
  scenarioVersion: number;
  stepId: string | null;
  completedStepIds: string[];
  choices: Record<string, string>;
  outcomes: Record<string, TutorialOutcome>;
  flags: string[];
  endingId: string | null;
  hintMode: TutorialHintMode;
  safety: TutorialSafety;
  heroLife: number;
  enemyLife: number;
  combatRound: number;
  lastRoll: TutorialRoll | null;
};

export type TutorialGate =
  | { kind: "ack" }
  | { kind: "safety" }
  | { kind: "choice"; key: string }
  | { kind: "roll"; key: string }
  | { kind: "flag"; flag: string }
  | { kind: "ending" };

export type TutorialStep = {
  id: string;
  title: string;
  phase: "导入" | "主要" | "高潮" | "结局";
  targetView: "prep" | "sheet" | "director" | "battle" | "tutorial";
  instruction: string;
  why: string;
  gate: TutorialGate;
  next: string | null;
  gmPrompt?: string;
  teachingPoint?: string;
  failForward?: string;
};

export type TutorialPresetCharacter = {
  character: Character;
  role: "hero" | "ally" | "enemy";
  overview: string;
  playTips: string[];
};

export type TutorialAttack = {
  id: string;
  name: string;
  range: number;
  cost: number;
  target: number;
  damage: number;
  description: string;
};

export type TutorialEnemyPlan = {
  round: number;
  plot: number;
  target: number;
  damage: number;
  prompt: string;
};

export type TutorialEnding = {
  id: string;
  choice: "seal" | "break" | "carry";
  title: string;
  summary: string;
  requiresTruth?: boolean;
};

export type TutorialScenario = {
  id: string;
  version: number;
  meta: {
    title: string;
    subtitle: string;
    format: string;
    playerCount: number;
    cycles: number;
    estimatedMinutes: number;
  };
  prize: { name: string; publicDescription: string };
  setup: { heroId: string; allyId: string; enemyId: string; initialLife: number };
  publicOpening: string;
  gmPrompts: Array<{ id: string; text: string }>;
  teachingPoints: string[];
  failForward: Array<{ checkKey: string; onFailure: string }>;
  characters: TutorialPresetCharacter[];
  npcIds: string[];
  steps: TutorialStep[];
  attacks: TutorialAttack[];
  enemyPlans: TutorialEnemyPlan[];
  endings: TutorialEnding[];
};

const fullLife = () => ({ 器术: true, 体术: true, 忍术: true, 谋术: true, 战术: true, 妖术: true });

const hero: Character = {
  id: "rain-zero-hero-asagiri",
  name: "朝雾澄",
  role: "PC",
  faction: "夜渡小队",
  rank: "中忍",
  backgroundItems: [],
  plot: null,
  active: true,
  extraLife: 0,
  life: fullLife(),
  skills: ["刀术", "潜伏术", "调查术", "第六感", "传达术", "结界术"],
  ninpoIds: ["close", "shoot", "cross", "blast"],
  ninpoSkills: { close: "刀术", shoot: "第六感" },
  conditions: [],
  spentCost: 0,
  usedNinpoIds: [],
  mission: "在零号线抵达终点前找回白狐匣，并让被困乘客平安下车。",
  secret: "师父留下的密令只有一句：如果匣中传来你的名字，绝不能把它交给任何组织。",
  ougi: "雨幕折光",
  closedGaps: [false, false, true, false, false],
  acted: false,
  tools: { 兵粮丸: 2, 神通丸: 1, 遁甲符: 0 },
};

const ally: Character = {
  id: "rain-zero-ally-akari",
  name: "灯里",
  role: "NPC",
  faction: "夜巡档案室",
  rank: "中忍",
  backgroundItems: [],
  plot: null,
  active: true,
  extraLife: 0,
  life: fullLife(),
  skills: ["机关术", "医术", "调查术", "记忆术", "传达术", "结界术"],
  ninpoIds: ["close", "shoot", "blast"],
  ninpoSkills: { close: "结界术", shoot: "机关术" },
  conditions: [],
  spentCost: 0,
  usedNinpoIds: [],
  mission: "协助朝雾澄调查零号线，并救出车上的乘客。",
  secret: "灯里小时候曾从零号线生还；白狐匣里封存着她遗失的那段记忆。",
  ougi: "返照车窗",
  closedGaps: [false, true, false, false, false],
  acted: false,
  tools: { 兵粮丸: 1, 神通丸: 0, 遁甲符: 1 },
};

const enemy: Character = {
  id: "rain-zero-enemy-conductor",
  name: "无面车掌",
  role: "NPC",
  faction: "零号线",
  rank: "中忍",
  backgroundItems: [],
  plot: null,
  active: true,
  extraLife: 0,
  life: fullLife(),
  skills: ["绳术", "走法", "潜伏术", "傀儡术", "地利", "幻术"],
  ninpoIds: ["close", "shoot", "blast"],
  ninpoSkills: { close: "绳术", shoot: "幻术" },
  conditions: [],
  spentCost: 0,
  usedNinpoIds: [],
  mission: "让零号线带着白狐匣驶入永不天明的终点。",
  secret: "车掌不是一个人，而是所有没能下车的乘客共同戴上的面具。",
  ougi: "终点无站",
  closedGaps: [true, false, false, false, false],
  acted: false,
  tools: { 兵粮丸: 0, 神通丸: 1, 遁甲符: 1 },
};

const steps: TutorialStep[] = [
  {
    id: "welcome",
    title: "你的第一场忍务",
    phase: "导入",
    targetView: "tutorial",
    instruction: "先读开场。你只需要替朝雾澄做决定，系统会扮演主持人与其他角色。",
    why: "先知道自己要做什么，比一次记住全部规则更重要。",
    gate: { kind: "ack" },
    next: "safety",
  },
  {
    id: "safety",
    title: "确定故事边界",
    phase: "导入",
    targetView: "prep",
    instruction: "选择故事基调，填写不想出现或只想淡写的内容，然后确认。任何时候都能暂停。",
    why: "所有人都能安心投入时，紧张的故事才真正有趣。",
    gate: { kind: "safety" },
    next: "mission",
  },
  {
    id: "mission",
    title: "使命与秘密",
    phase: "导入",
    targetView: "prep",
    instruction: "阅读朝雾澄的公开使命，再单独查看秘密。不要急着寻找标准答案。",
    why: "使命告诉你要完成什么，秘密则让同一目标拥有个人代价。",
    gate: { kind: "ack" },
    next: "sheet-tour",
  },
  {
    id: "sheet-tour",
    title: "认识角色卡",
    phase: "导入",
    targetView: "sheet",
    instruction: "只看四处：六项生命、已习得特技、三件忍具和可用忍法。",
    why: "第一次游玩不需要背表；轮到使用时，系统会指出相关位置。",
    gate: { kind: "ack" },
    next: "cycle-1-open",
  },
  {
    id: "cycle-1-open",
    title: "第一循环：空车厢",
    phase: "主要",
    targetView: "director",
    instruction: "描述朝雾澄如何检查一节没有乘客、却不断响起交谈声的车厢。",
    why: "场景先从想做什么开始，再由判定回答结果是否顺利。",
    gate: { kind: "ack" },
    next: "cycle-1-check",
    gmPrompt: "窗上倒映着并不存在的乘客，其中一人正用口型说出你的名字。",
  },
  {
    id: "cycle-1-check",
    title: "第一次判定",
    phase: "主要",
    targetView: "battle",
    instruction: "用调查术寻找白狐匣留下的痕迹，投两颗六面骰。",
    why: "判定不是决定故事是否继续，而是决定你要不要为线索付出代价。",
    gate: { kind: "roll", key: "trace-carriage" },
    next: "cycle-1-result",
    teachingPoint: "骰点达到目标值便顺利成功；失败也会得到关键线索。",
    failForward: "你仍发现通往车顶的湿脚印，但车掌也察觉了搜索，战斗时会抢先逼近。",
  },
  {
    id: "cycle-1-result",
    title: "线索不会消失",
    phase: "主要",
    targetView: "director",
    instruction: "把结果写进场景：白狐匣在列车前部，车顶还有第二条路。",
    why: "关键线索永远到手；骰点改变的是处境与代价。",
    gate: { kind: "ack" },
    next: "cycle-2-open",
  },
  {
    id: "cycle-2-open",
    title: "第二循环：灯里的记忆",
    phase: "主要",
    targetView: "director",
    instruction: "灯里承认自己曾登上零号线。决定朝雾澄是安慰、追问，还是保持距离。",
    why: "感情不是强迫友好，而是记录角色之间足以影响行动的牵引。",
    gate: { kind: "ack" },
    next: "cycle-2-emotion",
    gmPrompt: "灯里把一张旧车票递来。背面是孩童字迹：不要让车到终点。",
  },
  {
    id: "cycle-2-emotion",
    title: "感情判定",
    phase: "主要",
    targetView: "director",
    instruction: "用传达术判定是否读懂灯里没有说出口的请求。",
    why: "建立感情后，角色可以在关键判定和情报流动上彼此影响。",
    gate: { kind: "roll", key: "trust-akari" },
    next: "cycle-2-choice",
    failForward: "灯里仍说出真相，但误会没有完全消失；你们带着一丝猜疑继续合作。",
  },
  {
    id: "cycle-2-choice",
    title: "回答灯里",
    phase: "主要",
    targetView: "director",
    instruction: "选择你对灯里的回答；这会影响最后如何处置白狐匣。",
    why: "角色选择与骰点同样重要，而且不会被一次失败抹去。",
    gate: { kind: "choice", key: "ally-response" },
    next: "climax-intro",
  },
  {
    id: "climax-intro",
    title: "高潮：雨中的车顶",
    phase: "高潮",
    targetView: "battle",
    instruction: "无面车掌带着白狐匣登上车顶。灯里留下稳住车厢，你独自追上去。",
    why: "高潮把之前得到的线索、关系和选择集中到一次明确冲突中。",
    gate: { kind: "ack" },
    next: "climax-plot",
  },
  {
    id: "climax-plot",
    title: "选择布局",
    phase: "高潮",
    targetView: "battle",
    instruction: "选择 1–6 的布局。数字越高越早行动，但失手的风险也随之增加。",
    why: "布局是速度与风险的交换，不存在永远正确的数字。",
    gate: { kind: "choice", key: "climax-plot" },
    next: "climax-battle",
  },
  {
    id: "climax-battle",
    title: "完成高潮战斗",
    phase: "高潮",
    targetView: "battle",
    instruction: "选择攻击并结算双方行动。三回合内击倒车掌，或坚持到列车驶出隧道。",
    why: "每回合都重复布局、判定、回避与效果；系统会逐项提示。",
    gate: { kind: "flag", flag: "combat-complete" },
    next: "ending",
    failForward: "即使没有击倒车掌，第三回合列车也会冲出隧道，白狐匣的命运仍由你决定。",
  },
  {
    id: "ending",
    title: "白狐匣的去向",
    phase: "结局",
    targetView: "tutorial",
    instruction: "根据你相信的人与查到的真相，选择重新封存、打破匣子或亲自带走。",
    why: "团务结局不是标准答案，而是使命、秘密与人物选择共同留下的后果。",
    gate: { kind: "ending" },
    next: "debrief",
  },
  {
    id: "debrief",
    title: "你的第一次忍务完成",
    phase: "结局",
    targetView: "tutorial",
    instruction: "回顾两次主要行动、一次感情、一次高潮战斗和最终选择。",
    why: "你已经走完一场短团；下一次只需换角色、场景和秘密，不必重新背规则。",
    gate: { kind: "ack" },
    next: null,
  },
];

export const RAIN_ZERO_LINE: TutorialScenario = {
  id: "rain-zero-line",
  version: 1,
  meta: {
    title: "雨夜零号线",
    subtitle: "一场从零开始的单人忍务",
    format: "两循环单人协力教学变体",
    playerCount: 1,
    cycles: 2,
    estimatedMinutes: 50,
  },
  prize: {
    name: "白狐匣",
    publicDescription: "一只会在雨夜发出列车报站声的旧漆匣，也是本次忍务争夺的目标。",
  },
  setup: {
    heroId: hero.id,
    allyId: ally.id,
    enemyId: enemy.id,
    initialLife: 4,
  },
  publicOpening: "午夜之后，城市地图上不存在的零号线驶进站台。车门打开时，车内无人，座椅却都是温热的。白狐匣就在这班车上，而终点将在五十分钟后抵达。",
  gmPrompts: [
    { id: "train-arrives", text: "先问玩家：朝雾澄为何愿意踏进一班不该存在的列车？" },
    { id: "empty-carriage", text: "让倒影比角色慢半拍，再把一条可追查的湿脚印放到画面里。" },
    { id: "akari-ticket", text: "灯里的真相应当推动合作，而不是把玩家逼进唯一选择。" },
    { id: "roof-climax", text: "每次掷骰前先说清成功会得到什么、失败会付出什么。" },
  ],
  teachingPoints: [
    "从角色意图开始场景，再决定是否需要判定。",
    "关键线索采用失败前进：失败改变代价，不封死剧情。",
    "感情会影响帮助、阻碍与情报，但不替玩家决定立场。",
    "高潮按布局、攻击、回应和效果逐步结算。",
  ],
  failForward: [
    { checkKey: "trace-carriage", onFailure: "仍获得白狐匣位置，同时追加 flag：conductor-alerted。" },
    { checkKey: "trust-akari", onFailure: "仍得知灯里的往事，同时追加 flag：akari-doubt。" },
  ],
  characters: [
    { character: hero, role: "hero", overview: "第一次独立执行忍务的调查型忍者，擅长观察、潜入和在关键时刻做决定。", playTips: ["不知道做什么时先调查环境。", "受伤时记得可以使用兵粮丸。"] },
    { character: ally, role: "ally", overview: "熟悉旧档案的联络员，也是零号线唯一已知的生还者。", playTips: ["她会提供线索，但不会替玩家作最终选择。"] },
    { character: enemy, role: "enemy", overview: "由失踪乘客共同戴上的面具，既是敌人，也是列车无法停下的原因。", playTips: ["按固定回合计划行动，便于新玩家预判。"] },
  ],
  npcIds: [ally.id, enemy.id],
  steps,
  attacks: [
    { id: "close", name: "近身截击", range: 1, cost: 0, target: 7, damage: 2, description: "贴近车掌，以短促斩击逼它松开白狐匣。" },
    { id: "shoot", name: "符钉牵制", range: 2, cost: 0, target: 6, damage: 1, description: "把符钉打进车顶，借线索预判车掌的移动。" },
  ],
  enemyPlans: [
    { round: 1, plot: 3, target: 7, damage: 1, prompt: "车掌挥出成串车票，试图把你钉在车顶。" },
    { round: 2, plot: 4, target: 7, damage: 1, prompt: "隧道灯逐盏熄灭，车掌从你的倒影里伸手。" },
    { round: 3, plot: 2, target: 6, damage: 2, prompt: "终点广播响起，车掌抱着白狐匣向车尾退去。" },
  ],
  endings: [
    { id: "dawn-platform", choice: "seal", title: "天明站台", summary: "你理解了匣中的记忆并重新封印它。零号线停在清晨的站台，乘客们终于能够下车。", requiresTruth: true },
    { id: "quiet-platform", choice: "seal", title: "无声站台", summary: "你重新封住白狐匣，却没有解开所有疑问。列车消失前，灯里听见有人在匣中道谢。" },
    { id: "shattered-dawn", choice: "break", title: "碎匣见晨", summary: "白狐匣破裂，记忆像白狐般跃入雨幕。零号线不复存在，但城市从此多了许多认不出故乡的人。" },
    { id: "last-passenger", choice: "carry", title: "最后的乘客", summary: "你带走白狐匣，列车在身后化作雨水。从今往后，每个暴雨夜都有人在梦里问你下一站在哪里。" },
  ],
};

function emptySafety(): TutorialSafety {
  return { tone: "balanced", lines: [], veils: [], confirmed: false, paused: false };
}

export function createIdleTutorialState(): TutorialState {
  return {
    schemaVersion: TUTORIAL_SCHEMA_VERSION,
    status: "off",
    scenarioId: null,
    scenarioVersion: 0,
    stepId: null,
    completedStepIds: [],
    choices: {},
    outcomes: {},
    flags: [],
    endingId: null,
    hintMode: "full",
    safety: emptySafety(),
    heroLife: RAIN_ZERO_LINE.setup.initialLife,
    enemyLife: RAIN_ZERO_LINE.setup.initialLife,
    combatRound: 0,
    lastRoll: null,
  };
}

export function createRainZeroLineTutorialState(): TutorialState {
  return {
    ...createIdleTutorialState(),
    status: "running",
    scenarioId: RAIN_ZERO_LINE.id,
    scenarioVersion: RAIN_ZERO_LINE.version,
    stepId: RAIN_ZERO_LINE.steps[0].id,
  };
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function boundedInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, Math.floor(parsed))) : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringRecord(value: unknown) {
  const raw = record(value);
  return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

function outcomeRecord(value: unknown): Record<string, TutorialOutcome> {
  const allowed: TutorialOutcome[] = ["success", "failure", "critical", "fumble"];
  return Object.fromEntries(
    Object.entries(record(value)).filter((entry): entry is [string, TutorialOutcome] => allowed.includes(entry[1] as TutorialOutcome)),
  );
}

function validDie(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 6;
}

function normalizeLastRoll(value: unknown): TutorialRoll | null {
  const raw = record(value);
  const dice = Array.isArray(raw.dice) ? raw.dice : [];
  const outcomes: TutorialOutcome[] = ["success", "failure", "critical", "fumble"];
  if (typeof raw.key !== "string" || dice.length !== 2 || !validDie(dice[0]) || !validDie(dice[1]) || !outcomes.includes(raw.outcome as TutorialOutcome)) return null;
  return {
    key: raw.key,
    dice: [dice[0], dice[1]],
    total: dice[0] + dice[1],
    target: boundedInteger(raw.target, 7, 2, 20),
    outcome: raw.outcome as TutorialOutcome,
  };
}

export function normalizeTutorialState(value: unknown): TutorialState {
  const outer = record(value);
  const raw = Object.prototype.hasOwnProperty.call(outer, "tutorial") ? record(outer.tutorial) : outer;
  const statuses: TutorialStatus[] = ["off", "running", "complete"];
  const status = statuses.includes(raw.status as TutorialStatus) ? raw.status as TutorialStatus : "off";
  if (status === "off" || raw.scenarioId !== RAIN_ZERO_LINE.id) return createIdleTutorialState();

  const stepIds = new Set(RAIN_ZERO_LINE.steps.map((step) => step.id));
  const completedStepIds = Array.from(new Set(stringArray(raw.completedStepIds).filter((id) => stepIds.has(id))));
  const fallbackStep = RAIN_ZERO_LINE.steps.find((step) => !completedStepIds.includes(step.id))?.id ?? null;
  const stepId = status === "complete" ? null : (typeof raw.stepId === "string" && stepIds.has(raw.stepId) ? raw.stepId : fallbackStep);
  const safetyRaw = record(raw.safety);
  const tones: TutorialSafetyTone[] = ["gentle", "balanced", "dramatic"];
  const endingIds = new Set(RAIN_ZERO_LINE.endings.map((ending) => ending.id));

  return {
    schemaVersion: TUTORIAL_SCHEMA_VERSION,
    status: stepId == null ? "complete" : status,
    scenarioId: RAIN_ZERO_LINE.id,
    scenarioVersion: boundedInteger(raw.scenarioVersion, RAIN_ZERO_LINE.version, 1, RAIN_ZERO_LINE.version),
    stepId,
    completedStepIds,
    choices: stringRecord(raw.choices),
    outcomes: outcomeRecord(raw.outcomes),
    flags: Array.from(new Set(stringArray(raw.flags))),
    endingId: typeof raw.endingId === "string" && endingIds.has(raw.endingId) ? raw.endingId : null,
    hintMode: raw.hintMode === "compact" ? "compact" : "full",
    safety: {
      tone: tones.includes(safetyRaw.tone as TutorialSafetyTone) ? safetyRaw.tone as TutorialSafetyTone : "balanced",
      lines: stringArray(safetyRaw.lines).slice(0, 20),
      veils: stringArray(safetyRaw.veils).slice(0, 20),
      confirmed: safetyRaw.confirmed === true,
      paused: safetyRaw.paused === true,
    },
    heroLife: boundedInteger(raw.heroLife, RAIN_ZERO_LINE.setup.initialLife, 0, 12),
    enemyLife: boundedInteger(raw.enemyLife, RAIN_ZERO_LINE.setup.initialLife, 0, 12),
    combatRound: boundedInteger(raw.combatRound, 0, 0, 3),
    lastRoll: normalizeLastRoll(raw.lastRoll),
  };
}

export function getTutorialStep(state: TutorialState): TutorialStep | null {
  if (state.status !== "running" || state.scenarioId !== RAIN_ZERO_LINE.id || !state.stepId) return null;
  return RAIN_ZERO_LINE.steps.find((step) => step.id === state.stepId) ?? null;
}

function gateSatisfied(state: TutorialState, gate: TutorialGate) {
  if (gate.kind === "ack") return true;
  if (gate.kind === "safety") return state.safety.confirmed;
  if (gate.kind === "choice") return Boolean(state.choices[gate.key]);
  if (gate.kind === "roll") return Boolean(state.outcomes[gate.key]);
  if (gate.kind === "flag") return state.flags.includes(gate.flag);
  return Boolean(state.endingId);
}

export function advanceTutorial(state: TutorialState): TutorialState {
  const step = getTutorialStep(state);
  if (!step || state.safety.paused || !gateSatisfied(state, step.gate)) return state;
  const completedStepIds = Array.from(new Set([...state.completedStepIds, step.id]));
  if (step.next == null) return { ...state, status: "complete", stepId: null, completedStepIds };
  return { ...state, stepId: step.next, completedStepIds };
}

export function recordTutorialChoice(state: TutorialState, key: string, value: string): TutorialState {
  const cleanKey = key.trim();
  const cleanValue = value.trim();
  if (state.status !== "running" || !cleanKey || !cleanValue) return state;
  let safety = state.safety;
  if (cleanKey === "safety-confirmed") safety = { ...safety, confirmed: ["yes", "true", "confirmed"].includes(cleanValue.toLowerCase()) };
  if (cleanKey === "safety-tone" && ["gentle", "balanced", "dramatic"].includes(cleanValue)) safety = { ...safety, tone: cleanValue as TutorialSafetyTone };
  const next = { ...state, choices: { ...state.choices, [cleanKey]: cleanValue }, safety };
  return advanceTutorial(next);
}

export function setTutorialPaused(state: TutorialState, paused: boolean): TutorialState {
  return { ...state, safety: { ...state.safety, paused } };
}

function readDice(dice: readonly number[]): [number, number] {
  if (dice.length !== 2 || !validDie(dice[0]) || !validDie(dice[1])) throw new RangeError("教学判定需要两颗 1–6 的骰面。" );
  return [dice[0], dice[1]];
}

function outcomeFor(total: number, target: number, fumbleLine = 2): TutorialOutcome {
  if (total === 12) return "critical";
  if (total <= fumbleLine) return "fumble";
  return total >= target ? "success" : "failure";
}

export function rollTutorialCheck(
  state: TutorialState,
  key: string,
  dice: readonly number[],
  target: number,
  failFlag?: string,
): TutorialState {
  if (state.status !== "running" || !key.trim()) return state;
  const pair = readDice(dice);
  const safeTarget = boundedInteger(target, 7, 2, 20);
  const total = pair[0] + pair[1];
  const outcome = outcomeFor(total, safeTarget);
  const failed = outcome === "failure" || outcome === "fumble";
  const flags = failed && failFlag ? Array.from(new Set([...state.flags, failFlag])) : state.flags;
  const next = {
    ...state,
    outcomes: { ...state.outcomes, [key]: outcome },
    flags,
    lastRoll: { key, dice: pair, total, target: safeTarget, outcome },
  };
  return advanceTutorial(next);
}

export type TutorialCombatInput = {
  plot: number;
  attackId: string;
  dice: readonly number[];
  enemyDice: readonly number[];
};

export type TutorialCombatStatus = "continue" | "victory" | "defeat" | "mutual" | "round-limit";

export type TutorialCombatResult = {
  valid: boolean;
  errors: string[];
  summary: string[];
  status: TutorialCombatStatus;
  state: TutorialState;
};

function combatStatus(state: TutorialState): TutorialCombatStatus {
  if (state.flags.includes("combat-mutual")) return "mutual";
  if (state.flags.includes("combat-victory")) return "victory";
  if (state.flags.includes("combat-defeat")) return "defeat";
  if (state.flags.includes("combat-round-limit")) return "round-limit";
  return "continue";
}

export function resolveTutorialCombatRound(state: TutorialState, input: TutorialCombatInput): TutorialCombatResult {
  const errors: string[] = [];
  const round = state.combatRound + 1;
  const plan = RAIN_ZERO_LINE.enemyPlans.find((item) => item.round === round);
  const attack = RAIN_ZERO_LINE.attacks.find((item) => item.id === input.attackId);
  if (state.status !== "running" || state.scenarioId !== RAIN_ZERO_LINE.id) errors.push("当前不是雨夜零号线教学团。" );
  if (state.flags.includes("combat-complete") || state.combatRound >= 3) errors.push("高潮战斗已经结束。" );
  if (!Number.isInteger(input.plot) || input.plot < 1 || input.plot > 6) errors.push("布局必须是 1–6 的整数。" );
  if (!attack) errors.push("所选攻击不属于教学角色。" );
  if (!plan) errors.push("没有可执行的敌方回合计划。" );
  if (input.dice.length !== 2 || !input.dice.every(validDie)) errors.push("玩家骰面必须是两颗 1–6。" );
  if (input.enemyDice.length !== 2 || !input.enemyDice.every(validDie)) errors.push("敌方骰面必须是两颗 1–6。" );
  if (attack && plan && Math.abs(input.plot - plan.plot) > attack.range) errors.push(`与敌方布局相差 ${Math.abs(input.plot - plan.plot)}，超过【${attack.name}】距离 ${attack.range}。`);
  if (attack && attack.cost > input.plot) errors.push(`【${attack.name}】花费 ${attack.cost} 超过当前布局 ${input.plot}。`);
  if (errors.length || !attack || !plan) return { valid: false, errors, summary: [], status: combatStatus(state), state };

  const playerDice = readDice(input.dice);
  const foeDice = readDice(input.enemyDice);
  const playerTotal = playerDice[0] + playerDice[1];
  const foeTotal = foeDice[0] + foeDice[1];
  const playerOutcome = outcomeFor(playerTotal, attack.target, input.plot);
  const foeOutcome = outcomeFor(foeTotal, plan.target, plan.plot);
  const playerHit = playerOutcome === "success" || playerOutcome === "critical";
  const foeHit = foeOutcome === "success" || foeOutcome === "critical";
  let heroLife = state.heroLife;
  let enemyLife = state.enemyLife;
  const summary = [`第 ${round} 回合：朝雾澄布局 ${input.plot}，无面车掌布局 ${plan.plot}。`];

  const resolveHero = () => {
    if (heroLife <= 0) return;
    if (playerHit) {
      enemyLife = Math.max(0, enemyLife - attack.damage);
      summary.push(`朝雾澄以【${attack.name}】掷出 ${playerTotal}，命中并造成 ${attack.damage} 点伤害。`);
    } else {
      summary.push(`朝雾澄以【${attack.name}】掷出 ${playerTotal}，${playerOutcome === "fumble" ? "发生失手" : "未能命中"}。`);
    }
  };
  const resolveEnemy = () => {
    if (enemyLife <= 0) return;
    if (foeHit) {
      heroLife = Math.max(0, heroLife - plan.damage);
      summary.push(`无面车掌掷出 ${foeTotal}，${plan.prompt} 朝雾澄失去 ${plan.damage} 点生命。`);
    } else {
      summary.push(`无面车掌掷出 ${foeTotal}，攻击被雨幕打偏。`);
    }
  };

  if (input.plot > plan.plot) {
    resolveHero();
    resolveEnemy();
  } else if (input.plot < plan.plot) {
    resolveEnemy();
    resolveHero();
  } else {
    const heroDamage = playerHit ? attack.damage : 0;
    const foeDamage = foeHit ? plan.damage : 0;
    enemyLife = Math.max(0, enemyLife - heroDamage);
    heroLife = Math.max(0, heroLife - foeDamage);
    summary.push(`双方同速行动：朝雾澄掷出 ${playerTotal}${playerHit ? `，造成 ${heroDamage} 点伤害` : "，未命中"}；车掌掷出 ${foeTotal}${foeHit ? `，造成 ${foeDamage} 点伤害` : "，未命中"}。`);
  }

  let flags = Array.from(new Set([...state.flags, `combat-round-${round}-resolved`]));
  if (playerOutcome === "fumble") flags = Array.from(new Set([...flags, `combat-round-${round}-hero-fumble`]));
  if (foeOutcome === "fumble") flags = Array.from(new Set([...flags, `combat-round-${round}-enemy-fumble`]));
  let status: TutorialCombatStatus = "continue";
  if (heroLife <= 0 && enemyLife <= 0) {
    status = "mutual";
    flags = Array.from(new Set([...flags, "combat-mutual", "combat-complete"]));
  } else if (enemyLife <= 0) {
    status = "victory";
    flags = Array.from(new Set([...flags, "combat-victory", "combat-complete"]));
  } else if (heroLife <= 0) {
    status = "defeat";
    flags = Array.from(new Set([...flags, "combat-defeat", "combat-complete"]));
  } else if (round >= 3) {
    status = "round-limit";
    flags = Array.from(new Set([...flags, "combat-round-limit", "combat-complete"]));
  }
  summary.push(`生命：朝雾澄 ${heroLife}／${RAIN_ZERO_LINE.setup.initialLife}，无面车掌 ${enemyLife}／${RAIN_ZERO_LINE.setup.initialLife}。`);
  if (status === "round-limit") summary.push("第三回合结束，列车冲出隧道；剧情继续进入白狐匣的最终选择。" );
  if (status === "victory") summary.push("无面车掌的面具碎裂，白狐匣落到你的手中。" );
  if (status === "defeat") summary.push("朝雾澄倒下，但灯里及时稳住列车，为最后的选择争取到片刻。" );

  const next: TutorialState = {
    ...state,
    heroLife,
    enemyLife,
    combatRound: round,
    flags,
    outcomes: {
      ...state.outcomes,
      [`combat-${round}-hero`]: playerOutcome,
      [`combat-${round}-enemy`]: foeOutcome,
    },
    lastRoll: { key: `combat-${round}-hero`, dice: playerDice, total: playerTotal, target: attack.target, outcome: playerOutcome },
  };
  return { valid: true, errors: [], summary, status, state: advanceTutorial(next) };
}

export function chooseTutorialEnding(state: TutorialState, choice: string): TutorialState {
  if (state.status !== "running" || !["seal", "break", "carry"].includes(choice)) return state;
  const knowsTruth = ["success", "critical"].includes(state.outcomes["trace-carriage"] ?? "failure");
  const ending = choice === "seal"
    ? RAIN_ZERO_LINE.endings.find((item) => item.choice === "seal" && Boolean(item.requiresTruth) === knowsTruth)
    : RAIN_ZERO_LINE.endings.find((item) => item.choice === choice);
  if (!ending) return state;
  const next = {
    ...state,
    endingId: ending.id,
    choices: { ...state.choices, "final-prize": choice },
    flags: Array.from(new Set([...state.flags, "ending-selected"])),
  };
  return advanceTutorial(next);
}
