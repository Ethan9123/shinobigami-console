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
    ninpoSkills: { close: "刀术", shoot: "手里剑术" },
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

test("free designated skill must be chosen and resolves to the chosen skill (audit #13)", () => {
  const close = rules.COMMON_NINPO.find((item) => item.id === "close");
  const blast = rules.COMMON_NINPO.find((item) => item.id === "blast");
  assert.equal(rules.ALL_SKILLS.length, 66);
  assert.equal(rules.designatedSkillChoices(rules.COMMON_NINPO[0]).length, 66);
  assert.deepEqual(rules.designatedSkillChoices(blast), [], "a fixed designated skill needs no choice");
  assert.deepEqual(rules.designatedSkillChoices({ skill: "无" }), []);
  assert.deepEqual(rules.designatedSkillChoices({ skill: "可变" }), []);
  assert.deepEqual(rules.designatedSkillChoices({ skill: "自由", skillOptions: ["火术", "水术", "不存在", "火术"] }), ["火术", "水术"]);

  assert.equal(rules.resolveDesignatedSkill(close, { close: "火术" }).skill, "火术");
  assert.equal(rules.resolveDesignatedSkill(close, {}).needsChoice, true);
  assert.equal(rules.resolveDesignatedSkill(close, {}).skill, null);
  assert.equal(rules.resolveDesignatedSkill(close, { close: "不是特技" }).needsChoice, true);
  assert.deepEqual(rules.resolveDesignatedSkill(blast, {}), { skill: "火术", needsChoice: false, variable: false });
  assert.deepEqual(rules.resolveDesignatedSkill({ id: "x", skill: "无" }, {}), { skill: null, needsChoice: false, variable: false });
  assert.equal(rules.resolveDesignatedSkill({ id: "x", skill: "可变" }, {}).variable, true);
  assert.equal(rules.resolveDesignatedSkill({ id: "x", skill: "自由", skillOptions: ["火术", "水术"] }, { x: "刀术" }).needsChoice, true, "choice outside the listed options is rejected");
});

test("free skill no longer pretends every learned skill hits at 5", () => {
  const resolved = rules.nearestSkill(["刀术"], "火术");
  assert.equal(resolved.distance, 10);
  assert.equal(resolved.target, 15);
  assert.equal(rules.nearestSkill(["刀术"], "自由").unresolved, true);
  assert.notEqual(rules.nearestSkill(["刀术"], "自由").target, 5);
  assert.equal(rules.substituteSkill(["刀术"], "自由", "刀术").unresolved, true);
});

test("pre-flight gate blocks unset free designated skills with a one-click suggestion", () => {
  const character = {
    id: "pc1",
    name: "测试忍者",
    role: "PC",
    faction: "鞍马神流",
    skills: ["刀术", "走法"],
    ninpoIds: ["close", "shoot", "blast"],
    mission: "完成使命",
    secret: "私人秘密",
    tools: {},
  };
  const requirements = { requiredSkills: 2, requiredNinpoSlots: 2, requiredTools: 0 };
  const unset = rules.evaluateCharacterBuild(character, requirements).filter((issue) => issue.code === "free-skill-unset");
  assert.equal(unset.length, 2);
  assert.ok(unset.every((issue) => issue.level === "blocker"));
  assert.deepEqual(unset[0].fix, { ninpoId: "close", skill: "刀术" });
  assert.match(unset[0].message, /接近战攻击/);

  const chosen = rules.evaluateCharacterBuild({ ...character, ninpoSkills: { close: "刀术", shoot: "走法" } }, requirements);
  assert.equal(chosen.some((issue) => issue.code === "free-skill-unset"), false);

  const custom = { id: "ninpo-custom", name: "自创斩", kind: "攻击", skill: "自由", range: 1, cost: 0, summary: "" };
  const withCustom = rules.evaluateCharacterBuild(
    { ...character, ninpoIds: [...character.ninpoIds, custom.id], ninpoSkills: { close: "刀术", shoot: "走法" } },
    requirements,
    [...rules.COMMON_NINPO, custom],
  );
  assert.equal(withCustom.filter((issue) => issue.code === "free-skill-unset").length, 1, "custom free ninpo also require a choice");
});

test("reversal makes every action check fail automatically unless exempt", () => {
  assert.deepEqual(rules.resolveCheckOutcome({ raw: 12, target: 5, reversed: true }), { result: "失败（逆止）", achieved: 0 });
  assert.deepEqual(rules.resolveCheckOutcome({ raw: 7, modifier: 3, target: 5, reversed: true }), { result: "失败（逆止）", achieved: 0 });
  assert.equal(rules.resolveCheckOutcome({ raw: 12, target: 5, reversed: true, reversalExempt: true }).result, "大成功");
  assert.equal(rules.resolveCheckOutcome({ raw: 6, target: 5, reversed: true, reversalExempt: true }).result, "成功");

  assert.deepEqual(rules.calculateCheckOdds(2, 5, 0, 12, 2, false, true), { success: 0, critical: 0, fumble: 0, ordinarySuccess: 0 });
  assert.equal(Number(rules.calculateCheckOdds(2, 5, 0, 12, 2, false, false).success.toFixed(4)), 0.8333);
});

test("check outcome keeps existing special-roll semantics", () => {
  // 大成功、大失败看修正前骰点
  assert.deepEqual(rules.resolveCheckOutcome({ raw: 12, modifier: -5, target: 13 }), { result: "大成功", achieved: 7 });
  assert.equal(rules.resolveCheckOutcome({ raw: 2, modifier: 10, target: 5 }).result, "大失败");
  assert.equal(rules.resolveCheckOutcome({ raw: 4, modifier: 3, target: 5, fumbleLine: 4, inAttackWindow: true }).result, "大失败／逆止");
  assert.equal(rules.resolveCheckOutcome({ raw: 7, target: 7 }).result, "成功");
  assert.equal(rules.resolveCheckOutcome({ raw: 6, target: 7 }).result, "失败");
  // 无可用特技：只有大成功才算成功
  assert.equal(rules.resolveCheckOutcome({ raw: 11, modifier: 5, target: 13, criticalOnly: true }).result, "失败");
  assert.equal(rules.resolveCheckOutcome({ raw: 12, target: 13, criticalOnly: true }).result, "大成功");
});

test("check panel inputs reset to a fresh state", () => {
  assert.deepEqual(rules.freshCheckInputs(), { substituteSkillChoice: "auto", modifier: 0, diceCount: 2, supportCost: 0, reversalExempt: false });
  const first = rules.freshCheckInputs();
  first.modifier = 3;
  assert.equal(rules.freshCheckInputs().modifier, 0, "each call returns a new object");
});

test("plot 0 uses fumble value 2 and ignores distance when targeted", () => {
  assert.equal(rules.checkFumbleLine({ inAttackWindow: true, plot: 0 }), 2);
  for (let plot = 1; plot <= 11; plot += 1) assert.equal(rules.checkFumbleLine({ inAttackWindow: true, plot }), plot);
  assert.equal(rules.checkFumbleLine({ inAttackWindow: false, plot: 0 }), 2);

  const exempt = rules.battleTargetCheck({ attackerPlot: 6, targetPlot: 0, range: 0 });
  assert.equal(exempt.ok, true);
  assert.equal(exempt.exempt, true);
  assert.equal(exempt.distance, 6);
  assert.equal(rules.battleTargetCheck({ attackerPlot: 0, targetPlot: 3, range: 1 }).ok, false);
  assert.match(rules.battleTargetCheck({ attackerPlot: 5, targetPlot: 2, range: 1 }).reason, /距离 3 超过忍法距离 1/);
  assert.deepEqual(rules.battleTargetCheck({ attackerPlot: 4, targetPlot: 3, range: 1 }), { ok: true, distance: 1, exempt: false });
  assert.equal(rules.battleTargetCheck({ attackerPlot: null, targetPlot: 3, range: 1 }).ok, true, "unset plots are left to the GM");

  // 一般人：只能打布局等于预测值或为 0 的目标
  assert.equal(rules.battleTargetCheck({ attackerPlot: 0, targetPlot: 4, range: 1, attackerIsOrdinary: true, prediction: 4 }).ok, true);
  assert.equal(rules.battleTargetCheck({ attackerPlot: 0, targetPlot: 0, range: 1, attackerIsOrdinary: true, prediction: 4 }).ok, true);
  assert.equal(rules.battleTargetCheck({ attackerPlot: 0, targetPlot: 3, range: 6, attackerIsOrdinary: true, prediction: 4 }).ok, false);
});

test("action order runs from high plot to 0, unset plots last", () => {
  const order = rules.actionOrder([{ id: "a", plot: 6 }, { id: "b", plot: 0 }, { id: "c", plot: 3 }]);
  assert.deepEqual(order.map((item) => item.plot), [6, 3, 0]);
  const withUnset = rules.actionOrder([{ id: "a", plot: null }, { id: "b", plot: 0 }, { id: "c", plot: 2 }, { id: "d", plot: 2 }]);
  assert.deepEqual(withUnset.map((item) => item.id), ["c", "d", "b", "a"]);
});

test("attack ninpo are limited to the actor's own turn, once per round, with GM override", () => {
  const base = { kind: "攻击", revealed: true, actorId: "a", currentActorId: "a", attackedThisTurn: false };
  assert.deepEqual(rules.canDeclareAttack(base), []);
  assert.equal(rules.canDeclareAttack({ ...base, attackedThisTurn: true }).length, 1, "second attack in the same round is rejected");
  assert.match(rules.canDeclareAttack({ ...base, currentActorId: "b", currentActorName: "雾隐" })[0], /雾隐/);
  assert.equal(rules.canDeclareAttack({ ...base, revealed: false }).length, 1);
  assert.deepEqual(rules.canDeclareAttack({ ...base, kind: "支援", currentActorId: "b", attackedThisTurn: true }), [], "support ninpo follow their own timing");
  assert.deepEqual(rules.canDeclareAttack({ ...base, currentActorId: "b", attackedThisTurn: true, gmOverride: true }), []);
});

test("importer recognizes Japanese general ninpo names and written designated skills", () => {
  const japanese = rules.parseCharacterText("忍法：接近戦攻撃、射撃戦攻撃、鎌鼬、爆破");
  assert.deepEqual(japanese.ninpoIds.sort(), ["blast", "close", "kamaitachi", "shoot"]);

  const designated = rules.parseCharacterText("忍法：接近战攻击（刀术）、射撃戦攻撃《手裏剣術》");
  assert.deepEqual(designated.ninpoSkills, { close: "刀术", shoot: "手里剑术" });

  const slash = rules.parseCharacterText("接近戦攻撃／刀術");
  assert.deepEqual(slash.ninpoSkills, { close: "刀术" });

  const plain = rules.parseCharacterText("忍法：接近战攻击");
  assert.deepEqual(plain.ninpoSkills, {}, "no designated skill is guessed when the card does not state one");
});
