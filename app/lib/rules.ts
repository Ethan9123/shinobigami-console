export const FIELD_NAMES = ["器术", "体术", "忍术", "谋术", "战术", "妖术"] as const;

export type FieldName = (typeof FIELD_NAMES)[number];

export const SKILL_TABLE: Record<FieldName, string[]> = {
  器术: ["机关术", "火术", "水术", "针术", "藏兵术", "衣装术", "绳术", "登术", "拷问术", "坏器术", "挖掘术"],
  体术: ["骑乘术", "炮术", "手里剑术", "手练", "身体操术", "步法", "走法", "飞术", "骨法术", "刀术", "怪力"],
  忍术: ["生存术", "潜伏术", "遁走术", "盗听术", "腹语术", "隐形术", "变装术", "香术", "分身术", "隐蔽术", "第六感"],
  谋术: ["医术", "毒术", "陷阱术", "调查术", "诈术", "对人术", "游艺", "女忍术", "傀儡术", "流言术", "经济力"],
  战术: ["兵粮术", "鸟兽术", "野战术", "地利", "意气", "用兵术", "记忆术", "见敌术", "暗号术", "传达术", "人脉"],
  妖术: ["异形化", "召唤术", "死灵术", "结界术", "封术", "言灵术", "幻术", "瞳术", "千里眼之术", "凭依术", "咒术"],
};

/** 特技表全部 66 项，按分野与行序排列。 */
export const ALL_SKILLS: string[] = FIELD_NAMES.flatMap((field) => SKILL_TABLE[field]);

/** 忍法「指定特技」栏的特殊取值：习得时自选／无需判定／每次判定可换。 */
export const FREE_SKILL = "自由";
export const NO_SKILL = "无";
export const VARIABLE_SKILL = "可变";

export type Ninpo = {
  id: string;
  name: string;
  kind: "攻击" | "支援" | "装备";
  skill: string;
  /** 复数指定特技或「任意X术」：习得时从中选定 1 个。 */
  skillOptions?: string[];
  range: number;
  cost: number;
  summary: string;
  damage?: string;
  serial?: string;
  school?: string;
  note?: string;
};

export type BackgroundItem = {
  id: string;
  serial: string;
  name: string;
  category: string;
  points: number;
  effect: string;
};

export const COMMON_NINPO: Ninpo[] = [
  { id: "close", name: "接近战攻击", kind: "攻击", skill: "自由", range: 1, cost: 0, damage: "接近战伤害 1", summary: "标准近距离攻击。命中后造成 1 点接近战伤害。" },
  { id: "shoot", name: "射击战攻击", kind: "攻击", skill: "自由", range: 2, cost: 0, damage: "射击战伤害 1", summary: "标准远距离攻击。命中后造成 1 点射击战伤害。" },
  { id: "blast", name: "爆破", kind: "攻击", skill: "火术", range: 1, cost: 1, damage: "射击战伤害 2", summary: "短距离高威力射击战攻击。" },
  { id: "cross", name: "交叉", kind: "攻击", skill: "刀术", range: 0, cost: 1, damage: "接近战伤害 2", summary: "在同一布局发动的高威力斩击。" },
  { id: "poison", name: "毒手", kind: "攻击", skill: "毒术", range: 0, cost: 1, damage: "接近战伤害 1＋麻痹", summary: "命中后造成伤害，并附加麻痹变调。" },
  { id: "kamaitachi", name: "镰鼬", kind: "攻击", skill: "绳术", range: 2, cost: 1, damage: "射击战伤害 1", summary: "难以回避的远距离攻击，回避判定受到减值。" },
];

export const CONDITIONS = ["故障", "麻痹", "重伤", "行踪不明", "忘却", "诅咒", "逆止"];

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

/** 习得时需要从中选定指定特技的候选；指定特技已固定、为「无」或「可变」时返回空数组。 */
export function designatedSkillChoices(ninpo: Pick<Ninpo, "skill" | "skillOptions">): string[] {
  if (ninpo.skillOptions?.length) {
    return ninpo.skillOptions.filter((skill, index, list) => ALL_SKILLS.includes(skill) && list.indexOf(skill) === index);
  }
  if (ninpo.skill === FREE_SKILL) return [...ALL_SKILLS];
  return [];
}

export type DesignatedSkillResolution = { skill: string | null; needsChoice: boolean; variable: boolean };

/**
 * 解析忍法实际使用的指定特技。
 * ninpoSkills 以角色 ninpoIds 中的条目为键（为将来同名※忍法的多实例预留），值为习得时选定的特技。
 */
export function resolveDesignatedSkill(
  ninpo: Pick<Ninpo, "id" | "skill" | "skillOptions">,
  ninpoSkills: Record<string, string> = {},
  key = ninpo.id,
): DesignatedSkillResolution {
  if (ninpo.skill === NO_SKILL) return { skill: null, needsChoice: false, variable: false };
  if (ninpo.skill === VARIABLE_SKILL) return { skill: null, needsChoice: false, variable: true };
  const choices = designatedSkillChoices(ninpo);
  if (choices.length) {
    const chosen = ninpoSkills[key];
    return chosen && choices.includes(chosen)
      ? { skill: chosen, needsChoice: false, variable: false }
      : { skill: null, needsChoice: true, variable: false };
  }
  return { skill: ninpo.skill, needsChoice: false, variable: false };
}

export type SkillCheck = { skill: string; distance: number; target: number; criticalOnly: boolean; unresolved?: boolean };

// 「自由」尚未解析为具体特技：不再冒充目标值 5，按“无可用特技”保守处理并带 unresolved 标记，调用方应先解析指定特技。
const UNRESOLVED_CHECK: SkillCheck = { skill: "未指定特技", distance: 8, target: 13, criticalOnly: true, unresolved: true };

export function nearestSkill(learned: string[], target: string, closedGaps: boolean[] = []): SkillCheck {
  if (!target || target === FREE_SKILL) return { ...UNRESOLVED_CHECK };
  if (!learned.length) return { skill: "无可用特技", distance: 8, target: 13, criticalOnly: true };
  const sorted = learned
    .map((skill) => ({ skill, distance: skillDistance(skill, target, closedGaps) }))
    .sort((a, b) => a.distance - b.distance);
  return { ...sorted[0], target: 5 + sorted[0].distance, criticalOnly: false };
}

export function substituteSkill(
  learned: string[],
  target: string,
  selectedSkill: string,
  closedGaps: boolean[] = [],
): SkillCheck {
  if (!target || target === FREE_SKILL) return { ...UNRESOLVED_CHECK };
  if (!learned.length) return { skill: "无可用特技", distance: 8, target: 13, criticalOnly: true };
  if (!learned.includes(selectedSkill)) return nearestSkill(learned, target, closedGaps);
  const distance = skillDistance(selectedSkill, target, closedGaps);
  return { skill: selectedSkill, distance, target: 5 + distance, criticalOnly: false };
}

export function checkFumbleLine({
  inAttackWindow = false,
  plot = null,
  supportCost = 0,
}: {
  inAttackWindow?: boolean;
  plot?: number | null;
  supportCost?: number;
} = {}) {
  // 布局值 0（布局违规、一般人）：攻击顺序按 0 处理，但大失败值视为 2
  if (inAttackWindow && plot != null) return Math.floor(plot) <= 0 ? 2 : Math.min(11, Math.floor(plot));
  return Math.max(1, Math.min(11, 2 + Math.max(0, Math.floor(supportCost))));
}

export type CheckOutcome = { result: string; achieved: number };

/**
 * 行为判定结果。大成功、大失败只看修正前骰点；无可用特技时只有大成功算成功。
 * 逆止中的行为判定自动失败、达成值视为 0；奥义或写明可在逆止中使用的效果可豁免。
 */
export function resolveCheckOutcome({
  raw,
  modifier = 0,
  target,
  criticalOnly = false,
  fumbleLine = 2,
  special = 12,
  inAttackWindow = false,
  reversed = false,
  reversalExempt = false,
}: {
  raw: number;
  modifier?: number;
  target: number;
  criticalOnly?: boolean;
  fumbleLine?: number;
  special?: number;
  inAttackWindow?: boolean;
  reversed?: boolean;
  reversalExempt?: boolean;
}): CheckOutcome {
  if (reversed && !reversalExempt) return { result: "失败（逆止）", achieved: 0 };
  const achieved = raw + modifier;
  let result = !criticalOnly && achieved >= target ? "成功" : "失败";
  if (raw >= special) result = "大成功";
  if (raw <= fumbleLine) result = inAttackWindow ? "大失败／逆止" : "大失败";
  return { result, achieved };
}

export type CheckInputs = { substituteSkillChoice: string; modifier: number; diceCount: number; supportCost: number; reversalExempt: boolean };

/** 判定面板在换人、换回合时回到的初始输入：代用选择、修正、骰池与花费都不跨判定沿用。 */
export function freshCheckInputs(): CheckInputs {
  return { substituteSkillChoice: "auto", modifier: 0, diceCount: 2, supportCost: 0, reversalExempt: false };
}

export type BattleTargetCheck = { ok: boolean; distance: number | null; exempt: boolean; reason?: string };

/**
 * 忍法目标的距离检查。目标布局值为 0 且攻方布局 ≥1 时无视距离；
 * 一般人只能以布局值等于预测值或为 0 的角色为目标（此时不看距离）。
 */
export function battleTargetCheck({
  attackerPlot,
  targetPlot,
  range,
  attackerIsOrdinary = false,
  prediction = null,
}: {
  attackerPlot: number | null | undefined;
  targetPlot: number | null | undefined;
  range: number;
  attackerIsOrdinary?: boolean;
  prediction?: number | null;
}): BattleTargetCheck {
  if (attackerPlot == null || targetPlot == null) return { ok: true, distance: null, exempt: false };
  const distance = Math.abs(attackerPlot - targetPlot);
  if (attackerIsOrdinary) {
    return targetPlot <= 0 || (prediction != null && targetPlot === prediction)
      ? { ok: true, distance, exempt: true }
      : { ok: false, distance, exempt: false, reason: `一般人只能攻击布局值等于预测值${prediction == null ? "" : ` ${prediction}`}或为 0 的角色` };
  }
  if (targetPlot <= 0 && attackerPlot >= 1) return { ok: true, distance, exempt: true };
  return distance > range
    ? { ok: false, distance, exempt: false, reason: `距离 ${distance} 超过忍法距离 ${range}` }
    : { ok: true, distance, exempt: false };
}

/** 行动顺序：布局值由高到低，布局 0 排在有布局者的最后，未设置布局的再往后；同布局保持原顺序。 */
export function actionOrder<T extends { plot: number | null }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (b.item.plot ?? -1) - (a.item.plot ?? -1) || a.index - b.index)
    .map(({ item }) => item);
}

/** 攻击忍法只能在轮到自己行动时宣言，且一回合一次；GM 可为追加攻击等特例覆盖。支援、装备忍法不受限。 */
export function canDeclareAttack({
  kind,
  revealed,
  actorId,
  currentActorId,
  currentActorName,
  attackedThisTurn,
  gmOverride = false,
}: {
  kind: Ninpo["kind"];
  revealed: boolean;
  actorId: string;
  currentActorId: string | null | undefined;
  currentActorName?: string;
  attackedThisTurn: boolean;
  gmOverride?: boolean;
}): string[] {
  if (kind !== "攻击" || gmOverride) return [];
  const problems: string[] = [];
  if (!revealed) problems.push("布局公开前不能宣言攻击忍法");
  else if (currentActorId && actorId !== currentActorId) problems.push(`攻击忍法只能在自己行动时宣言（当前行动者：${currentActorName ?? "其他角色"}）`);
  if (attackedThisTurn) problems.push("本回合已经进行过攻击（攻击忍法一回合只能宣言一次）");
  return problems;
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
  criticalOnly = false,
  reversed = false,
): CheckOdds {
  // 逆止中的行为判定自动失败：连大成功也不会发生
  if (reversed) return { success: 0, critical: 0, fumble: 0, ordinarySuccess: 0 };
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
    else if (!criticalOnly && raw + modifier >= target) ordinarySuccess += 1;
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
  掘削術: "挖掘术",
  掘削术: "挖掘术",
  騎乗術: "骑乘术",
  砲術: "炮术",
  手裏剣術: "手里剑术",
  手練: "手练",
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
  香術: "香术",
  分身の術: "分身术",
  隠蔽術: "隐蔽术",
  罠術: "陷阱术",
  医術: "医术",
  毒術: "毒术",
  調査術: "调查术",
  詐術: "诈术",
  対人術: "对人术",
  遊芸: "游艺",
  九ノ一の術: "女忍术",
  くノ一の術: "女忍术",
  色诱术: "女忍术",
  傀儡の術: "傀儡术",
  流言の術: "流言术",
  経済力: "经济力",
  兵糧術: "兵粮术",
  鳥獣術: "鸟兽术",
  野戦術: "野战术",
  地の利: "地利",
  意気: "意气",
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
  千里眼の術: "千里眼之术",
  千里眼术: "千里眼之术",
  憑依術: "凭依术",
  呪術: "咒术",
};

// 泛用忍法的日文写法（戦≠战、鎌≠镰，简中名 includes 匹配不到）
const NINPO_ALIASES: Record<string, string[]> = {
  close: ["接近戦攻撃"],
  shoot: ["射撃戦攻撃"],
  kamaitachi: ["鎌鼬"],
};

function normalizeSkillName(value: string): string | null {
  const trimmed = value.trim().replace(/^[《〈【「]|[》〉】」]$/g, "");
  if (ALL_SKILLS.includes(trimmed)) return trimmed;
  return SKILL_ALIASES[trimmed] ?? null;
}

export type ParsedCharacterText = {
  name?: string;
  faction?: string;
  subFaction?: string;
  condition?: string;
  style?: string;
  rank?: string;
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
  mission?: string;
  secret?: string;
  ougi?: string;
  ougiSkill?: string;
  ougiEffect?: string;
  ougiStrength?: string;
  ougiWeakness?: string;
  skills: string[];
  ninpoIds: string[];
  /** 「自由」忍法在卡面上写明的指定特技，如“接近战攻击（刀术）”。 */
  ninpoSkills: Record<string, string>;
  backgroundItems: BackgroundItem[];
  recognized: number;
};

// 背景清单行：序号(3~5位) 名称 点数(可负) 类别(长处/短处，可带系别括注) 效果
const BACKGROUND_LINE = /^(\d{3,5})\s+(\S+)\s+(-?\d+)\s*((?:长处|短处|長處|短處)(?:[（(][^（）()]*[）)])?)?\s*(.*)$/;

export function parseCharacterText(input: string): ParsedCharacterText {
  const text = input.replace(/\r/g, "").trim();
  const result: ParsedCharacterText = { skills: [], ninpoIds: [], ninpoSkills: {}, backgroundItems: [], recognized: 0 };
  if (!text) return result;

  const labels: Array<[keyof Pick<ParsedCharacterText, "name" | "faction" | "condition" | "style" | "rank" | "player" | "age" | "gender" | "cover" | "belief" | "enemy" | "surface" | "story" | "backgrounds" | "mission" | "secret" | "ougi" | "ougiSkill" | "ougiEffect" | "ougiStrength" | "ougiWeakness">, RegExp]> = [
    ["name", /^(?:名前|姓名|角色名)\s*[：:]\s*(.*)$/i],
    ["faction", /^(?:流派|所属流派)\s*[：:]\s*(.*)$/i],
    ["condition", /^(?:条件|條件|习得条件|習得條件)\s*[：:]\s*(.*)$/i],
    ["style", /^(?:流仪|流儀)\s*[：:]\s*(.*)$/i],
    ["rank", /^(?:階級|阶级|等級|等级)\s*[：:]\s*(.*)$/i],
    ["player", /^(?:玩家|PL|Player)\s*[：:]\s*(.*)$/i],
    ["age", /^(?:年龄|年齢)\s*[：:]\s*(.*)$/i],
    ["gender", /^(?:性别|性別)\s*[：:]\s*(.*)$/i],
    ["cover", /^(?:表之颜|表の顔|表的身份|表身份)\s*[：:]\s*(.*)$/i],
    ["belief", /^(?:信念)\s*[：:]\s*(.*)$/i],
    ["enemy", /^(?:仇敌|仇敵)\s*[：:]\s*(.*)$/i],
    ["surface", /^(?:表之颜|表之顏|表的身份)\s*[：:]\s*(.*)$/i],
    ["story", /^(?:人物故事|设定|設定|角色故事)\s*[：:]\s*(.*)$/i],
    ["backgrounds", /^(?:背景|背景清单|背景清單)\s*[：:]\s*(.*)$/i],
    ["mission", /^【?(?:使命)】?\s*[：:]?\s*(.*)$/i],
    ["secret", /^【?(?:秘密)】?\s*[：:]?\s*(.*)$/i],
    ["ougi", /^(?:奥義名|奧義名|奥义名|奥義|奧義|奥义)\s*[：:]\s*(.*)$/i],
    ["ougiSkill", /^(?:指定特技)\s*[：:]\s*(.*)$/i],
    ["ougiEffect", /^(?:奥义效果|奧義效果|奥義效果|效果)\s*[：:]\s*(.*)$/i],
    ["ougiStrength", /^(?:强化|強化|强项|強項)\s*[：:]\s*(.*)$/i],
    ["ougiWeakness", /^(?:弱点|弱點)\s*[：:]\s*(.*)$/i],
  ];
  let activeBlock: "mission" | "secret" | "story" | "backgrounds" | null = null;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^(?:●|■|――|忍法\d*|特技|器術|体術|忍術|謀術|戦術|妖術|器术|体术|忍术|谋术|战术|妖术)\s*[：:]?/.test(line)) {
      activeBlock = null;
    }
    let matched = false;
    for (const [key, pattern] of labels) {
      const hit = line.match(pattern);
      if (!hit) continue;
      const value = hit[1]?.trim();
      if (value) result[key] = value;
      activeBlock = key === "mission" || key === "secret" || key === "story" || key === "backgrounds" ? key : null;
      matched = true;
      break;
    }
    // 仅在背景清单块内识别背景行，避免把正文里以数字开头的叙述误判为背景条目
    if (!matched && activeBlock === "backgrounds") {
      const backgroundHit = line.match(BACKGROUND_LINE);
      if (backgroundHit) {
        result.backgroundItems.push({
          id: uid("bg"),
          serial: backgroundHit[1],
          name: backgroundHit[2],
          points: Number(backgroundHit[3]),
          category: backgroundHit[4]?.trim() ?? "",
          effect: backgroundHit[5]?.trim() ?? "",
        });
        matched = true;
      }
    }
    if (!matched && activeBlock && !/^(?:●|■|――|忍法|背景|人物|特技)/.test(line)) {
      result[activeBlock] = [result[activeBlock], line].filter(Boolean).join("\n");
    }
  }

  if (result.faction) {
    const cleaned = result.faction.replace(/[【】]/g, "").trim();
    const split = cleaned.match(/^(.+?)[-－・·](.+)$/);
    if (split) {
      result.faction = split[1].trim();
      result.subFaction = split[2].trim();
    } else {
      result.faction = cleaned;
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
    const names = [ninpo.name, ...(NINPO_ALIASES[ninpo.id] ?? [])];
    const found = names.filter((name) => text.includes(name));
    if (!found.length) continue;
    result.ninpoIds.push(ninpo.id);
    if (!designatedSkillChoices(ninpo).length) continue;
    // 识别“接近战攻击（刀术）”“接近戦攻撃《刀術》”“接近战攻击／刀术”这类写明指定特技的写法
    for (const name of found) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const hit = text.match(new RegExp(`${escaped}\\s*(?:[（(《〈【「]\\s*([^）)》〉】」\\n]{1,8}?)\\s*[）)》〉】」]|[／/:：]\\s*《?([^\\s、，,。／/》]{1,8})》?)`));
      const skill = hit ? normalizeSkillName(hit[1] ?? hit[2] ?? "") : null;
      if (skill) {
        result.ninpoSkills[ninpo.id] = skill;
        break;
      }
    }
  }
  const merit = text.match(/(?:功绩点|功績點|功績)\s*[：:]\s*(-?\d+)/i);
  if (merit) result.merit = Number(merit[1]);
  result.recognized = [result.name, result.faction, result.subFaction, result.condition, result.style, result.rank, result.player, result.age, result.gender, result.cover, result.belief, result.enemy, result.story, result.backgrounds, result.mission, result.secret, result.ougi, result.ougiSkill, result.ougiEffect, result.ougiStrength, result.ougiWeakness]
    .filter(Boolean).length + result.skills.length + result.ninpoIds.length + result.backgroundItems.length;
  if (result.merit != null) result.recognized += 1;
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
  ninpoSkills?: Record<string, string>;
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
  /** 一键修复建议：为某个「自由」忍法指定特技。 */
  fix?: { ninpoId: string; skill: string };
};

/** 为「自由」忍法建议一个默认指定特技：按角色卡顺序取第一个可选的已习得特技，否则取候选首项。 */
export function suggestDesignatedSkill(ninpo: Pick<Ninpo, "skill" | "skillOptions">, learned: string[]): string | null {
  const choices = designatedSkillChoices(ninpo);
  return learned.find((skill) => choices.includes(skill)) ?? choices[0] ?? null;
}

export function evaluateCharacterBuild(
  character: PreflightCharacter,
  requirements: BuildRequirements,
  ninpoCatalog: Ninpo[] = COMMON_NINPO,
): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  // v1.1 以前曾把系统动作“感情修正”保存成伪忍法；迁移时不能让它占用忍法槽。
  const ninpoSlots = new Set(character.ninpoIds.filter((id) => id !== "close" && id !== "emotion")).size;
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
  for (const ninpoId of Array.from(new Set(character.ninpoIds))) {
    const ninpo = ninpoCatalog.find((item) => item.id === ninpoId);
    if (!ninpo || !resolveDesignatedSkill(ninpo, character.ninpoSkills ?? {}).needsChoice) continue;
    const suggestion = suggestDesignatedSkill(ninpo, character.skills);
    issues.push({
      code: "free-skill-unset",
      level: "blocker",
      characterId: character.id,
      message: `${character.name} 的【${ninpo.name}】尚未指定特技（习得时须从「${ninpo.skill}」中选定 1 个${suggestion ? `；建议：${suggestion}` : ""}）。`,
      fix: suggestion ? { ninpoId, skill: suggestion } : undefined,
    });
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
  ninpoCatalog: Ninpo[] = COMMON_NINPO,
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
  for (const character of pcs) issues.push(...evaluateCharacterBuild(character, requirements, ninpoCatalog));
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
