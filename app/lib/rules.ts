export const FIELD_NAMES = ["器术", "体术", "忍术", "谋术", "战术", "妖术"] as const;

export type FieldName = (typeof FIELD_NAMES)[number];

export const SKILL_TABLE: Record<FieldName, string[]> = {
  器术: ["机关术", "火术", "水术", "针术", "藏兵术", "衣装术", "绳术", "登术", "拷问术", "坏器术", "掘削术"],
  体术: ["骑乘术", "炮术", "手里剑术", "手练", "身体操术", "步法", "走法", "飞术", "骨法术", "刀术", "怪力"],
  忍术: ["生存术", "潜伏术", "遁走术", "盗听术", "腹语术", "隐形术", "变装术", "香术", "分身术", "隐蔽术", "第六感"],
  谋术: ["医术", "毒术", "陷阱术", "调查术", "诈术", "对人术", "游艺", "色诱术", "傀儡术", "流言术", "经济力"],
  战术: ["兵粮术", "鸟兽术", "野战术", "地利", "意气", "用兵术", "记忆术", "见敌术", "暗号术", "传达术", "人脉"],
  妖术: ["异形化", "召唤术", "死灵术", "结界术", "封术", "言灵术", "幻术", "瞳术", "千里眼术", "凭依术", "咒术"],
};

export type Ninpo = {
  id: string;
  name: string;
  kind: "攻击" | "支援" | "装备";
  skill: string;
  range: number;
  cost: number;
  summary: string;
  damage?: string;
};

export const COMMON_NINPO: Ninpo[] = [
  { id: "close", name: "接近战攻击", kind: "攻击", skill: "自由", range: 1, cost: 0, damage: "接近战伤害 1", summary: "标准近距离攻击。命中后造成 1 点接近战伤害。" },
  { id: "shoot", name: "射击战攻击", kind: "攻击", skill: "自由", range: 2, cost: 0, damage: "射击战伤害 1", summary: "标准远距离攻击。命中后造成 1 点射击战伤害。" },
  { id: "blast", name: "爆破", kind: "攻击", skill: "火术", range: 1, cost: 1, damage: "射击战伤害 2", summary: "短距离高威力射击战攻击。" },
  { id: "cross", name: "交叉", kind: "攻击", skill: "刀术", range: 0, cost: 1, damage: "接近战伤害 2", summary: "在同一布局发动的高威力斩击。" },
  { id: "poison", name: "毒手", kind: "攻击", skill: "毒术", range: 0, cost: 1, damage: "接近战伤害 1＋麻痹", summary: "命中后造成伤害，并附加麻痹变调。" },
  { id: "kamaitachi", name: "镰鼬", kind: "攻击", skill: "绳术", range: 2, cost: 1, damage: "射击战伤害 1", summary: "难以回避的远距离攻击，回避判定受到减值。" },
  { id: "emotion", name: "感情修正", kind: "支援", skill: "自由", range: 99, cost: 0, summary: "在投骰前给予拥有感情的角色 +1 或 -1 修正。" },
];

export const CONDITIONS = ["麻痹", "重伤", "故障", "失忆", "行踪不明", "诅咒", "逆止"];

export const EMOTION_PAIRS = [
  ["共鸣", "猜疑"],
  ["友情", "愤怒"],
  ["爱情", "嫉妒"],
  ["忠诚", "轻蔑"],
  ["憧憬", "自卑"],
  ["狂信", "杀意"],
] as const;

type SkillPosition = { field: number; row: number };

export function findSkillPosition(skill: string): SkillPosition | null {
  for (let field = 0; field < FIELD_NAMES.length; field += 1) {
    const row = SKILL_TABLE[FIELD_NAMES[field]].indexOf(skill);
    if (row >= 0) return { field, row };
  }
  return null;
}

export function skillDistance(from: string, to: string, closedGaps: boolean[] = []): number {
  const a = findSkillPosition(from);
  const b = findSkillPosition(to);
  if (!a || !b) return 7;
  const firstField = Math.min(a.field, b.field);
  const lastField = Math.max(a.field, b.field);
  let horizontal = 0;
  for (let boundary = firstField; boundary < lastField; boundary += 1) {
    horizontal += closedGaps[boundary] ? 1 : 2;
  }
  return Math.abs(a.row - b.row) + horizontal;
}

export function nearestSkill(learned: string[], target: string, closedGaps: boolean[] = []) {
  if (!target || target === "自由") return { skill: learned[0] ?? "未选择", distance: 0, target: 5 };
  if (!learned.length) return { skill: "无可用特技", distance: 7, target: 12 };
  const sorted = learned
    .map((skill) => ({ skill, distance: skillDistance(skill, target, closedGaps) }))
    .sort((a, b) => a.distance - b.distance);
  return { ...sorted[0], target: Math.min(12, 5 + sorted[0].distance) };
}

export type CheckOdds = {
  success: number;
  critical: number;
  fumble: number;
  ordinarySuccess: number;
};

export function calculateCheckOdds(
  diceCount: number,
  target: number,
  modifier = 0,
  special = 12,
  fumble = 2,
): CheckOdds {
  const safeCount = Math.max(2, Math.min(6, Math.floor(diceCount)));
  const totalOutcomes = 6 ** safeCount;
  let critical = 0;
  let fumbleCount = 0;
  let ordinarySuccess = 0;
  const dice = Array.from({ length: safeCount }, () => 1);

  const visit = (index: number) => {
    if (index < safeCount) {
      for (let value = 1; value <= 6; value += 1) {
        dice[index] = value;
        visit(index + 1);
      }
      return;
    }
    const kept = [...dice].sort((a, b) => b - a).slice(0, 2);
    const raw = kept[0] + kept[1];
    if (raw <= fumble) fumbleCount += 1;
    else if (raw >= special) critical += 1;
    else if (raw + modifier >= target) ordinarySuccess += 1;
  };
  visit(0);

  return {
    success: (ordinarySuccess + critical) / totalOutcomes,
    critical: critical / totalOutcomes,
    fumble: fumbleCount / totalOutcomes,
    ordinarySuccess: ordinarySuccess / totalOutcomes,
  };
}

const SKILL_ALIASES: Record<string, string> = {
  絡繰術: "机关术",
  火術: "火术",
  水術: "水术",
  針術: "针术",
  仕込み: "藏兵术",
  衣装術: "衣装术",
  縄術: "绳术",
  登術: "登术",
  拷問術: "拷问术",
  壊器術: "坏器术",
  掘削術: "掘削术",
  騎乗術: "骑乘术",
  砲術: "炮术",
  手裏剣術: "手里剑术",
  身体操術: "身体操术",
  歩法: "步法",
  走法: "走法",
  飛術: "飞术",
  骨法術: "骨法术",
  刀術: "刀术",
  生存術: "生存术",
  潜伏術: "潜伏术",
  遁走術: "遁走术",
  盗聴術: "盗听术",
  腹話術: "腹语术",
  隠形術: "隐形术",
  変装術: "变装术",
  分身の術: "分身术",
  隠蔽術: "隐蔽术",
  罠術: "陷阱术",
  医術: "医术",
  毒術: "毒术",
  調査術: "调查术",
  詐術: "诈术",
  対人術: "对人术",
  遊芸: "游艺",
  九ノ一の術: "色诱术",
  傀儡の術: "傀儡术",
  流言の術: "流言术",
  経済力: "经济力",
  兵糧術: "兵粮术",
  鳥獣術: "鸟兽术",
  野戦術: "野战术",
  地の利: "地利",
  用兵術: "用兵术",
  記憶術: "记忆术",
  見敵術: "见敌术",
  暗号術: "暗号术",
  伝達術: "传达术",
  人脈: "人脉",
  異形化: "异形化",
  召喚術: "召唤术",
  死霊術: "死灵术",
  結界術: "结界术",
  封術: "封术",
  言霊術: "言灵术",
  幻術: "幻术",
  瞳術: "瞳术",
  千里眼の術: "千里眼术",
  憑依術: "凭依术",
  呪術: "咒术",
};

export type ParsedCharacterText = {
  name?: string;
  faction?: string;
  rank?: string;
  mission?: string;
  secret?: string;
  ougi?: string;
  skills: string[];
  ninpoIds: string[];
  recognized: number;
};

export function parseCharacterText(input: string): ParsedCharacterText {
  const text = input.replace(/\r/g, "").trim();
  const result: ParsedCharacterText = { skills: [], ninpoIds: [], recognized: 0 };
  if (!text) return result;

  const labels: Array<[keyof Pick<ParsedCharacterText, "name" | "faction" | "rank" | "mission" | "secret" | "ougi">, RegExp]> = [
    ["name", /^(?:名前|姓名|角色名)\s*[：:]\s*(.*)$/i],
    ["faction", /^(?:流派|所属流派)\s*[：:]\s*(.*)$/i],
    ["rank", /^(?:階級|阶级|等級|等级)\s*[：:]\s*(.*)$/i],
    ["mission", /^【?(?:使命)】?\s*[：:]?\s*(.*)$/i],
    ["secret", /^【?(?:秘密)】?\s*[：:]?\s*(.*)$/i],
    ["ougi", /^(?:奥義名|奧義名|奥义名|奥義|奧義|奥义)\s*[：:]\s*(.*)$/i],
  ];
  let activeBlock: "mission" | "secret" | null = null;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    let matched = false;
    for (const [key, pattern] of labels) {
      const hit = line.match(pattern);
      if (!hit) continue;
      const value = hit[1]?.trim();
      if (value) result[key] = value;
      activeBlock = key === "mission" || key === "secret" ? key : null;
      matched = true;
      break;
    }
    if (!matched && activeBlock && !/^(?:●|■|――|忍法|背景|人物|特技)/.test(line)) {
      result[activeBlock] = [result[activeBlock], line].filter(Boolean).join("\n");
    }
  }

  const allSkills = Object.values(SKILL_TABLE).flat();
  for (const skill of allSkills) {
    if (text.includes(skill)) result.skills.push(skill);
  }
  for (const [alias, normalized] of Object.entries(SKILL_ALIASES)) {
    if (text.includes(alias) && !result.skills.includes(normalized)) result.skills.push(normalized);
  }
  for (const ninpo of COMMON_NINPO) {
    if (text.includes(ninpo.name)) result.ninpoIds.push(ninpo.id);
  }
  result.recognized = [result.name, result.faction, result.rank, result.mission, result.secret, result.ougi]
    .filter(Boolean).length + result.skills.length + result.ninpoIds.length;
  return result;
}

export type BuildRequirements = {
  requiredSkills: number;
  requiredNinpoSlots: number;
  requiredTools: number;
};

export type PreflightCharacter = {
  id: string;
  name: string;
  role: "PC" | "NPC";
  faction: string;
  skills: string[];
  ninpoIds: string[];
  mission: string;
  secret: string;
  tools: Record<string, number>;
};

export type PreflightHandout = {
  id: string;
  slot: string;
  assignedCharacterId: string;
  recommendedFaction: string;
  delivered: boolean;
  reviewed: boolean;
  questionsResolved: boolean;
};

export type ReadinessIssue = {
  code: string;
  level: "blocker" | "warning";
  message: string;
  characterId?: string;
  handoutId?: string;
};

export function evaluateCharacterBuild(
  character: PreflightCharacter,
  requirements: BuildRequirements,
): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  const ninpoSlots = new Set(character.ninpoIds.filter((id) => id !== "close")).size;
  const toolCount = Object.values(character.tools).reduce((sum, count) => sum + Math.max(0, Number(count) || 0), 0);

  if (!character.mission.trim()) {
    issues.push({ code: "missing-mission", level: "blocker", characterId: character.id, message: `${character.name} 尚未填写使命。` });
  }
  if (!character.secret.trim()) {
    issues.push({ code: "missing-secret", level: "blocker", characterId: character.id, message: `${character.name} 尚未确认秘密。` });
  }
  if (!character.ninpoIds.includes("close")) {
    issues.push({ code: "missing-basic-attack", level: "blocker", characterId: character.id, message: `${character.name} 缺少不占槽位的接近战攻击。` });
  }
  if (character.skills.length !== requirements.requiredSkills) {
    issues.push({
      code: "skill-quota",
      level: "warning",
      characterId: character.id,
      message: `${character.name} 目前有 ${character.skills.length} 项特技；本团检查值为 ${requirements.requiredSkills}。`,
    });
  }
  if (ninpoSlots !== requirements.requiredNinpoSlots) {
    issues.push({
      code: "ninpo-quota",
      level: "warning",
      characterId: character.id,
      message: `${character.name} 目前占用 ${ninpoSlots} 个忍法槽；本团检查值为 ${requirements.requiredNinpoSlots}。`,
    });
  }
  if (toolCount !== requirements.requiredTools) {
    issues.push({
      code: "tool-quota",
      level: "warning",
      characterId: character.id,
      message: `${character.name} 目前携带 ${toolCount} 个忍具；本团检查值为 ${requirements.requiredTools}。`,
    });
  }
  return issues;
}

export function evaluateSessionReadiness(
  characters: PreflightCharacter[],
  handouts: PreflightHandout[],
  playerCount: number,
  requirements: BuildRequirements,
): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  const pcs = characters.filter((character) => character.role === "PC");
  if (pcs.length !== playerCount) {
    issues.push({ code: "player-count", level: "blocker", message: `公告人数为 ${playerCount}，当前有 ${pcs.length} 位 PC。` });
  }
  if (handouts.length !== playerCount) {
    issues.push({ code: "handout-count", level: "blocker", message: `需要 ${playerCount} 份 PC 位，当前有 ${handouts.length} 份。` });
  }

  const assigned = handouts.map((handout) => handout.assignedCharacterId).filter(Boolean);
  const duplicateIds = new Set(assigned.filter((id, index) => assigned.indexOf(id) !== index));
  for (const handout of handouts) {
    const character = pcs.find((item) => item.id === handout.assignedCharacterId);
    if (!character) {
      issues.push({ code: "unassigned-handout", level: "blocker", handoutId: handout.id, message: `${handout.slot} 尚未分配给有效 PC。` });
      continue;
    }
    if (duplicateIds.has(character.id)) {
      issues.push({ code: "duplicate-assignment", level: "blocker", characterId: character.id, handoutId: handout.id, message: `${character.name} 被重复分配到多个 PC 位。` });
    }
    if (!handout.delivered) {
      issues.push({ code: "secret-undelivered", level: "blocker", characterId: character.id, handoutId: handout.id, message: `${handout.slot} 的秘密尚未确认送达。` });
    }
    if (!handout.reviewed) {
      issues.push({ code: "card-unreviewed", level: "blocker", characterId: character.id, handoutId: handout.id, message: `${character.name} 的角色卡尚未通过 GM 复核。` });
    }
    if (!handout.questionsResolved) {
      issues.push({ code: "questions-open", level: "blocker", characterId: character.id, handoutId: handout.id, message: `${handout.slot} 仍有秘密或规则问题待确认。` });
    }
    const recommended = handout.recommendedFaction.trim();
    if (recommended && recommended !== "不限" && character.faction.trim() !== recommended) {
      issues.push({
        code: "faction-recommendation",
        level: "warning",
        characterId: character.id,
        handoutId: handout.id,
        message: `${handout.slot} 推荐「${recommended}」，当前角色为「${character.faction || "未填写"}」。`,
      });
    }
  }
  for (const character of pcs) issues.push(...evaluateCharacterBuild(character, requirements));
  return issues;
}

export function makeLife(): Record<FieldName, boolean> {
  return Object.fromEntries(FIELD_NAMES.map((field) => [field, true])) as Record<FieldName, boolean>;
}

export function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
