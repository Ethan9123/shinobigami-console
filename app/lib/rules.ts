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
  kind: "攻击" | "支援";
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

type SkillPosition = { field: number; row: number };

export function findSkillPosition(skill: string): SkillPosition | null {
  for (let field = 0; field < FIELD_NAMES.length; field += 1) {
    const row = SKILL_TABLE[FIELD_NAMES[field]].indexOf(skill);
    if (row >= 0) return { field, row };
  }
  return null;
}

export function skillDistance(from: string, to: string): number {
  const a = findSkillPosition(from);
  const b = findSkillPosition(to);
  if (!a || !b) return 7;
  return Math.abs(a.row - b.row) + Math.abs(a.field - b.field) * 2;
}

export function nearestSkill(learned: string[], target: string) {
  if (!target || target === "自由") return { skill: learned[0] ?? "未选择", distance: 0, target: 5 };
  if (!learned.length) return { skill: "无可用特技", distance: 7, target: 12 };
  const sorted = learned
    .map((skill) => ({ skill, distance: skillDistance(skill, target) }))
    .sort((a, b) => a.distance - b.distance);
  return { ...sorted[0], target: Math.min(12, 5 + sorted[0].distance) };
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
