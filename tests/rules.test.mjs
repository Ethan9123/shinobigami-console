import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/lib/rules.ts", import.meta.url), "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const rules = await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`);

test("filled gaps shorten substitution distance", () => {
  assert.equal(rules.skillDistance("机关术", "骑乘术", [false]), 2);
  assert.equal(rules.skillDistance("机关术", "骑乘术", [true]), 1);
});

test("substitution follows revised rules without capping target value", () => {
  const automatic = rules.nearestSkill(["机关术", "怪力"], "咒术");
  const deliberate = rules.substituteSkill(["机关术", "怪力"], "咒术", "机关术");
  const unavailable = rules.nearestSkill([], "刀术");

  assert.equal(deliberate.skill, "机关术", "players may deliberately use a farther learned skill");
  assert.equal(deliberate.target, 5 + rules.skillDistance("机关术", "咒术"), "target value is 5 + distance and is not capped at 12");
  assert.ok(deliberate.target > 12);
  assert.ok(deliberate.target > automatic.target);
  assert.deepEqual(unavailable, { skill: "无可用特技", distance: 8, target: 13, criticalOnly: true });
  assert.equal(Number(rules.calculateCheckOdds(2, unavailable.target, 8, 12, 2, unavailable.criticalOnly).success.toFixed(4)), 0.0278, "only a critical succeeds without usable skills, even with modifiers");
});

test("fumble line changes only in the attack-processing window", () => {
  assert.equal(rules.checkFumbleLine(), 2);
  assert.equal(rules.checkFumbleLine({ plot: 5 }), 2);
  assert.equal(rules.checkFumbleLine({ inAttackWindow: true, plot: 5 }), 5);
  assert.equal(rules.checkFumbleLine({ supportCost: 2 }), 4);
});

test("fumble line never reaches 12 in either branch", () => {
  assert.equal(rules.checkFumbleLine({ supportCost: 9 }), 11);
  assert.equal(rules.checkFumbleLine({ supportCost: 99 }), 11);
  assert.equal(rules.checkFumbleLine({ inAttackWindow: true, plot: 12 }), 11);
  assert.equal(rules.checkFumbleLine({ inAttackWindow: true, plot: 99 }), 11);
});

test("revised condition and emotion terminology matches the current tables", () => {
  assert.deepEqual(rules.CONDITIONS.slice(0, 6), ["故障", "麻痹", "重伤", "行踪不明", "忘却", "诅咒"]);
  assert.deepEqual(rules.EMOTION_PAIRS[0], ["共鸣", "猜疑"]);
  assert.equal(rules.COMMON_NINPO.some((item) => item.id === "emotion"), false, "emotion modifier is a system rule, not a ninpo");
});

test("probability engine respects critical and fumble outcomes", () => {
  const odds = rules.calculateCheckOdds(2, 7, 0, 12, 2);
  assert.equal(Number(odds.success.toFixed(4)), 0.5833);
  assert.equal(Number(odds.critical.toFixed(4)), 0.0278);
  assert.equal(Number(odds.fumble.toFixed(4)), 0.0278);
});

test("plain-text importer recognizes local workbook style and Japanese skills", () => {
  const parsed = rules.parseCharacterText("名前：鸦羽\n流派：鞍马神流\n階級：中忍\n使命：守住秘宝\n特技：刀術、見敵術\n忍法：接近战攻击");
  assert.equal(parsed.name, "鸦羽");
  assert.equal(parsed.faction, "鞍马神流");
  assert.equal(parsed.rank, "中忍");
  assert.deepEqual(parsed.skills.sort(), ["刀术", "见敌术"]);
  assert.deepEqual(parsed.ninpoIds, ["close"]);
});

test("importer resolves renamed skills from new names, legacy names, and Japanese aliases", () => {
  const renamed = rules.parseCharacterText("特技：挖掘术、女忍术、千里眼之术");
  assert.deepEqual(renamed.skills.sort(), ["千里眼之术", "女忍术", "挖掘术"]);

  const legacy = rules.parseCharacterText("特技：掘削术、色诱术、千里眼术");
  assert.deepEqual(legacy.skills.sort(), ["千里眼之术", "女忍术", "挖掘术"]);

  const japanese = rules.parseCharacterText("特技：手練、香術、意気、くノ一の術");
  assert.deepEqual(japanese.skills.sort(), ["女忍术", "意气", "手练", "香术"]);
});

test("importer parses sub-faction, condition, style and structured background rows", () => {
  const parsed = rules.parseCharacterText([
    "名前：柊野雀",
    "流派：【隐忍血统-土蜘蛛】",
    "条件：从修得异形化的忍者中选择",
    "流仪：绝不向同伴透露自己的来历",
    "背景清单：",
    "10412 夜市眼线 3 长处（社会） 每周期一次，情报判定获得加值",
    "20077 旧伤未愈 -2 短处（肉体） 回复判定受到减值",
  ].join("\n"));
  assert.equal(parsed.name, "柊野雀");
  assert.equal(parsed.faction, "隐忍血统");
  assert.equal(parsed.subFaction, "土蜘蛛");
  assert.equal(parsed.condition, "从修得异形化的忍者中选择");
  assert.equal(parsed.style, "绝不向同伴透露自己的来历");
  assert.equal(parsed.backgroundItems.length, 2);
  assert.equal(parsed.backgroundItems[0].serial, "10412");
  assert.equal(parsed.backgroundItems[0].name, "夜市眼线");
  assert.equal(parsed.backgroundItems[0].points, 3);
  assert.equal(parsed.backgroundItems[0].category, "长处（社会）");
  assert.equal(parsed.backgroundItems[0].effect, "每周期一次，情报判定获得加值");
  assert.equal(parsed.backgroundItems[1].serial, "20077");
  assert.equal(parsed.backgroundItems[1].points, -2);
  assert.equal(parsed.backgroundItems[1].category, "短处（肉体）");

  const dotted = rules.parseCharacterText("流派：斜齿忍军・指矩班");
  assert.equal(dotted.faction, "斜齿忍军");
  assert.equal(dotted.subFaction, "指矩班");

  const plain = rules.parseCharacterText("流派：鞍马神流");
  assert.equal(plain.faction, "鞍马神流");
  assert.equal(plain.subFaction, undefined);
  assert.deepEqual(plain.backgroundItems, []);
});

test("importer stops multiline blocks when workbook sections change", () => {
  const parsed = rules.parseCharacterText([
    "名前：雨燕",
    "使命：守住秘宝",
    "这句属于使命正文",
    "●忍法",
    "接近战攻击",
    "特技：刀術、見敵術",
  ].join("\n"));

  assert.equal(parsed.mission, "守住秘宝\n这句属于使命正文");
  assert.deepEqual(parsed.skills.sort(), ["刀术", "见敌术"]);
  assert.deepEqual(parsed.ninpoIds, ["close"]);
});

test("pre-flight gate separates hard blockers from adjustable build quotas", () => {
  const character = {
    id: "pc1",
    name: "测试忍者",
    role: "PC",
    faction: "鞍马神流",
    skills: ["刀术", "走法", "见敌术", "潜伏术", "意气", "第六感"],
    ninpoIds: ["close", "cross", "shoot", "blast", "emotion"],
    mission: "完成使命",
    secret: "私人秘密",
    tools: { 兵粮丸: 0, 神通丸: 1, 遁甲符: 1 },
  };
  const handout = {
    id: "h1",
    slot: "PC1",
    assignedCharacterId: "pc1",
    recommendedFaction: "鞍马神流",
    delivered: false,
    reviewed: false,
    questionsResolved: false,
  };
  const requirements = { requiredSkills: 6, requiredNinpoSlots: 4, requiredTools: 2 };
  const blocked = rules.evaluateSessionReadiness([character], [handout], 1, requirements);
  assert.ok(blocked.some((issue) => issue.code === "ninpo-quota"), "legacy emotion pseudo-ninpo must not count toward the four slots");
  assert.deepEqual(blocked.map((issue) => issue.code).sort(), ["card-unreviewed", "ninpo-quota", "questions-open", "secret-undelivered"]);

  const ready = rules.evaluateSessionReadiness(
    [{ ...character, ninpoIds: [...character.ninpoIds, "kamaitachi"] }],
    [{ ...handout, delivered: true, reviewed: true, questionsResolved: true }],
    1,
    requirements,
  );
  assert.deepEqual(ready, []);
});
