import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const rulesSource = await readFile(new URL("../app/lib/rules.ts", import.meta.url), "utf8");
const rulesOutput = ts.transpileModule(rulesSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const rulesUrl = `data:text/javascript;base64,${Buffer.from(rulesOutput).toString("base64")}`;

const tutorialSource = await readFile(new URL("../app/lib/tutorial.ts", import.meta.url), "utf8");
const tutorialOutput = ts.transpileModule(tutorialSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const tutorialUrl = `data:text/javascript;base64,${Buffer.from(tutorialOutput).toString("base64")}`;

const transcriptSource = await readFile(new URL("../app/lib/transcript.ts", import.meta.url), "utf8");
const transcriptOutput = ts.transpileModule(transcriptSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const transcriptUrl = `data:text/javascript;base64,${Buffer.from(transcriptOutput).toString("base64")}`;

const replaySource = await readFile(new URL("../app/lib/replay.ts", import.meta.url), "utf8");
const replayOutput = ts.transpileModule(replaySource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const replayUrl = `data:text/javascript;base64,${Buffer.from(replayOutput).toString("base64")}`;

const sessionSource = (await readFile(new URL("../app/lib/session.ts", import.meta.url), "utf8"))
  .replaceAll('"./rules"', `"${rulesUrl}"`)
  .replaceAll('"./tutorial"', `"${tutorialUrl}"`)
  .replaceAll('"./transcript"', `"${transcriptUrl}"`)
  .replaceAll('"./replay"', `"${replayUrl}"`);
const sessionOutput = ts.transpileModule(sessionSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const session = await import(`data:text/javascript;base64,${Buffer.from(sessionOutput).toString("base64")}`);
const rules = await import(rulesUrl);

test("legacy v7 save migrates losslessly to the v0.8 treasure schema", () => {
  const migrated = session.normalizeGameState({
    characters: [{
      id: "legacy-pc",
      name: "旧角色",
      role: "PC",
      faction: "鞍马神流",
      rank: "中忍",
      life: { 器术: true },
      skills: ["刀术"],
      ninpoIds: ["close", "emotion"],
      conditions: ["失忆"],
      tools: { 神通丸: 1 },
    }],
    selectedId: "missing-id",
    phase: "主要",
  });

  assert.equal(migrated.schemaVersion, 9);
  assert.equal(migrated.selectedId, "legacy-pc");
  assert.deepEqual(migrated.characters[0].ninpoSkills, {}, "legacy saves do not guess the free designated skill");
  assert.equal(migrated.brief.playerCount, 1);
  assert.equal(migrated.handouts.length, 1);
  assert.equal(migrated.handouts[0].assignedCharacterId, "legacy-pc");
  assert.equal(migrated.resolution, null);
  assert.equal(migrated.tutorial.status, "off");
  assert.deepEqual(migrated.characters[0].closedGaps, [false, false, false, false, false]);
  assert.deepEqual(migrated.characters[0].tools, { 兵粮丸: 0, 神通丸: 1, 遁甲符: 0 });
  assert.equal(migrated.characters[0].portrait, "");
  assert.equal(migrated.characters[0].merit, 0);
  assert.equal(migrated.transcript, null);
  assert.equal(migrated.replay, null);
  assert.deepEqual(migrated.characters[0].backgroundItems, []);
  assert.deepEqual(migrated.treasures, []);
  assert.deepEqual(migrated.characters[0].ninpoIds, ["close"]);
  assert.deepEqual(migrated.characters[0].conditions, ["忘却"]);
});

test("legacy skill names in saves migrate to the current terminology", () => {
  const migrated = session.normalizeGameState({
    characters: [{
      id: "pc-legacy-skills",
      name: "旧档忍者",
      role: "PC",
      faction: "斜齿忍军",
      rank: "中忍",
      life: {},
      skills: ["掘削术", "色诱术", "千里眼术", "刀术"],
      ninpoIds: ["close"],
      tools: {},
      ougiSkill: "掘削术",
    }],
  });

  assert.deepEqual(migrated.characters[0].skills, ["挖掘术", "女忍术", "千里眼之术", "刀术"]);
  assert.equal(migrated.characters[0].ougiSkill, "挖掘术");
});

test("treasures and background items are normalized against the roster", () => {
  const migrated = session.normalizeGameState({
    characters: [{
      id: "pc-a",
      name: "灰原鹭",
      role: "PC",
      faction: "私立御斋学园",
      rank: "中忍",
      life: {},
      skills: ["刀术"],
      ninpoIds: ["close"],
      tools: {},
      backgroundItems: [
        { id: "bg-1", serial: "10412", name: "夜市眼线", points: "3", category: "长处（社会）", effect: "情报判定获得加值" },
        { serial: "20077", points: 5 },
        "not-an-object",
      ],
    }],
    treasures: [
      { id: "t1", name: "封蜡卷轴", holderId: "pc-a", note: "开局由灰原鹭保管" },
      { id: "t2", name: "无铭铜镜", holderId: "ghost-id", note: "" },
      { holderId: "pc-a", note: "缺少名称的非法项" },
      "not-an-object",
    ],
  });

  assert.equal(migrated.schemaVersion, 9);
  assert.deepEqual(migrated.characters[0].backgroundItems, [
    { id: "bg-1", serial: "10412", name: "夜市眼线", points: 3, category: "长处（社会）", effect: "情报判定获得加值" },
  ]);
  assert.equal(migrated.treasures.length, 2);
  assert.deepEqual(migrated.treasures[0], { id: "t1", name: "封蜡卷轴", holderId: "pc-a", note: "开局由灰原鹭保管" });
  assert.equal(migrated.treasures[1].name, "无铭铜镜");
  assert.equal(migrated.treasures[1].holderId, "");
});

test("invalid save is rejected instead of reaching the interface", () => {
  assert.equal(session.normalizeGameState({ characters: [] }), null);
  assert.equal(session.normalizeGameState({}), null);
});

test("attack pipeline advances only for the expected roller", () => {
  const declared = {
    id: "r1",
    actorId: "attacker",
    targetId: "defender",
    ninpoId: "close",
    ninpoName: "接近战攻击",
    ninpoKind: "攻击",
    skill: "刀术",
    stage: "命中判定",
  };
  assert.equal(session.advanceResolutionAfterRoll(declared, "someone-else", "成功"), declared);

  const hit = session.advanceResolutionAfterRoll(declared, "attacker", "成功");
  assert.equal(hit.stage, "反应窗口");
  assert.equal(hit.attackOutcome, "成功");

  const dodging = { ...hit, stage: "回避判定" };
  assert.equal(session.advanceResolutionAfterRoll(dodging, "defender", "成功").stage, "完成");
  assert.equal(session.advanceResolutionAfterRoll(dodging, "defender", "失败").stage, "效果结算");
  assert.equal(session.advanceResolutionAfterRoll(declared, "attacker", "大失败／逆止").stage, "完成");
  assert.equal(session.advanceResolutionAfterRoll(declared, "attacker", "失败（逆止）").stage, "完成", "automatic reversal failure ends the attack");
});

test("v9 ninpoSkills keep only learned free ninpo with valid skills", () => {
  const migrated = session.normalizeGameState({
    schemaVersion: 8,
    characters: [{
      id: "pc-free",
      name: "自由忍者",
      role: "PC",
      faction: "斜齿忍军",
      rank: "中忍",
      life: {},
      skills: ["挖掘术"],
      ninpoIds: ["close", "shoot"],
      ninpoSkills: { close: "掘削术", shoot: "不存在的特技", blast: "火术", emotion: "刀术" },
      tools: {},
    }],
  });
  assert.equal(migrated.schemaVersion, 9);
  assert.deepEqual(migrated.characters[0].ninpoSkills, { close: "挖掘术" }, "keys outside ninpoIds and unknown skills are dropped; legacy names migrate");

  const bad = session.normalizeGameState({ characters: [{ id: "x", ninpoIds: ["close"], ninpoSkills: ["刀术"] }] });
  assert.deepEqual(bad.characters[0].ninpoSkills, {});
});

test("plot values normalize to 0-6 so a plot violation can be stored", () => {
  const migrated = session.normalizeGameState({
    characters: [
      { id: "a", plot: 0 },
      { id: "b", plot: 7 },
      { id: "c", plot: -1 },
      { id: "d", plot: null },
    ],
  });
  assert.deepEqual(migrated.characters.map((character) => character.plot), [0, 6, 0, null]);
});

test("resolution keeps the resolved designated skill and evasion anchors to it", () => {
  const migrated = session.normalizeGameState({
    characters: [{ id: "attacker" }, { id: "defender" }],
    resolution: {
      id: "r1",
      actorId: "attacker",
      targetId: "defender",
      ninpoId: "close",
      ninpoName: "接近战攻击",
      ninpoKind: "攻击",
      skill: "自由",
      designatedSkill: "火术",
      stage: "反应窗口",
    },
  });
  assert.equal(migrated.resolution.designatedSkill, "火术");
  assert.equal(session.evasionSkill(migrated.resolution), "火术");

  const legacy = session.normalizeGameState({
    characters: [{ id: "attacker" }, { id: "defender" }],
    resolution: { actorId: "attacker", targetId: "defender", ninpoName: "接近战攻击", skill: "自由", stage: "回避判定" },
  });
  assert.equal(legacy.resolution.designatedSkill, undefined);
  assert.equal(session.evasionSkill(legacy.resolution), null, "legacy free resolutions ask the player instead of guessing");
  assert.equal(session.evasionSkill({ skill: "火术" }), "火术", "fixed designated skills are used directly");
  assert.equal(session.evasionSkill({ skill: "无" }), null);
});

test("sample characters ship with designated skills for their free attacks", () => {
  const initial = session.createInitialGameState();
  assert.equal(initial.schemaVersion, 9);
  for (const character of initial.characters) {
    assert.ok(character.ninpoSkills.close, `${character.name} 的接近战攻击应有指定特技`);
    assert.ok(character.ninpoSkills.shoot, `${character.name} 的射击战攻击应有指定特技`);
  }
});

test("paralyzed skills keep only learned skills, dedupe and migrate legacy names", () => {
  const migrated = session.normalizeGameState({
    characters: [{
      id: "pc-paralyzed",
      name: "麻痹忍者",
      skills: ["刀术", "挖掘术", "走法"],
      ninpoIds: ["close"],
      conditions: [],
      paralyzedSkills: ["掘削术", "刀术", "刀术", "火术", 42],
    }],
  });
  const character = migrated.characters[0];
  assert.deepEqual(character.paralyzedSkills, ["挖掘术", "刀术"]);
  assert.ok(character.conditions.includes("麻痹"), "a recorded seal restores the 麻痹 tag");
  assert.equal(migrated.schemaVersion, 9);
});

test("legacy paralysis tags stay without guessing which skill was sealed", () => {
  const input = { characters: [{ id: "legacy", skills: ["刀术", "走法"], ninpoIds: ["close"], conditions: ["麻痹"] }] };
  const first = session.normalizeGameState(input);
  const second = session.normalizeGameState(input);
  assert.deepEqual(first.characters[0].conditions, ["麻痹"]);
  assert.deepEqual(first.characters[0].paralyzedSkills, []);
  assert.deepEqual(first.characters[0].paralyzedSkills, second.characters[0].paralyzedSkills, "loading is deterministic");
});

test("outer gap normalizes to a boolean and closed gaps stay five wide", () => {
  const migrated = session.normalizeGameState({
    characters: [
      { id: "a", closedGaps: [true, false, false, false, false, true], outerGapClosed: true },
      { id: "b", outerGapClosed: "yes" },
      { id: "c" },
    ],
  });
  assert.deepEqual(migrated.characters.map((character) => character.outerGapClosed), [true, false, false]);
  assert.equal(migrated.characters[0].closedGaps.length, 5);
});

test("sample 月影 fills both gaps beside the 体术 specialty and has three 体术 skills", () => {
  const initial = session.createInitialGameState();
  const tsukikage = initial.characters.find((character) => character.id === "pc-tsukikage");
  assert.deepEqual(tsukikage.closedGaps, [true, true, false, false, false]);
  assert.equal(tsukikage.outerGapClosed, false);
  assert.deepEqual(tsukikage.paralyzedSkills, []);
  assert.equal(tsukikage.skills.filter((skill) => rules.SKILL_TABLE["体术"].includes(skill)).length, 3);
  assert.equal(rules.nearestSkill(tsukikage.skills, "机关术", rules.skillTableOptions(tsukikage)).target, 8);
  const issues = rules.evaluateCharacterBuild(tsukikage, initial.brief.requirements);
  assert.equal(issues.some((issue) => issue.code.startsWith("specialty-")), false, "the sample ships without specialty warnings");
});

test("malformed custom ninpo are dropped or coerced so the console can still render", () => {
  const state = session.normalizeGameState({
    characters: [{ id: "pc", role: "PC", skills: ["刀术"], ninpoIds: ["close", "x", "y", "z"], conditions: [] }],
    customNinpo: [
      { id: "x", name: 5 },
      { id: "y", name: "自定义", kind: "奇怪", skill: "自由", skillOptions: "刀术", range: "3", cost: "abc" },
      { id: "z", name: "多选", kind: "攻击", skill: "自由", skillOptions: ["刀术", 7, "掘削术"], range: 2, cost: 1, damage: "接近战伤害 1" },
      "not-an-object",
    ],
  });
  assert.deepEqual(state.customNinpo.map((ninpo) => ninpo.id), ["y", "z"], "entries without a string name are dropped");
  const [loose, multi] = state.customNinpo;
  assert.equal(loose.kind, "支援");
  assert.equal(loose.skillOptions, undefined, "a non-array skillOptions is discarded");
  assert.equal(loose.range, 3);
  assert.equal(loose.cost, 0);
  assert.deepEqual(multi.skillOptions, ["刀术", "挖掘术"]);
  assert.equal(multi.damage, "接近战伤害 1");
  const catalog = [...rules.COMMON_NINPO, ...state.customNinpo];
  assert.doesNotThrow(() => rules.skillTableOptions(state.characters[0], catalog));
  assert.doesNotThrow(() => rules.evaluateSessionReadiness(state.characters, state.handouts, state.brief.playerCount, state.brief.requirements, catalog));
});

test("createInitialGameState returns a fresh, internally consistent starter session", () => {
  const state = session.createInitialGameState();
  const ids = state.characters.map((character) => character.id);

  assert.equal(state.schemaVersion, 9);
  assert.ok(state.characters.length >= 2);
  assert.equal(new Set(ids).size, ids.length, "character ids are unique");
  assert.ok(state.characters.some((character) => character.role === "PC"));
  assert.ok(ids.includes(state.selectedId));
  assert.ok(ids.includes(state.sceneOwnerId));
  assert.ok(state.sceneParticipantIds.every((id) => ids.includes(id)));
  assert.equal(state.round, 1);
  assert.equal(state.cycle, 1);
  assert.equal(state.sceneNumber, 1);
  assert.equal(state.phase, "导入");
  assert.equal(state.resolution, null);
  assert.equal(state.transcript, null);
  assert.equal(state.replay, null);
  assert.equal(state.tutorial.status, "off");
  for (const character of state.characters) {
    assert.equal(character.plot, null);
    assert.ok(Object.values(character.life).every(Boolean), `${character.name} starts at full life`);
    assert.equal(character.spentCost, 0);
    assert.deepEqual(character.usedNinpoIds, []);
  }
  const pcs = state.characters.filter((character) => character.role === "PC");
  assert.equal(state.handouts.length, Math.max(1, state.brief.playerCount));
  assert.ok(state.handouts.every((handout) => handout.assignedCharacterId === "" || pcs.some((pc) => pc.id === handout.assignedCharacterId)));

  const other = session.createInitialGameState();
  assert.notEqual(other.characters, state.characters, "each call builds new objects");
  other.logs.push({ id: "mutated" });
  assert.equal(session.createInitialGameState().logs.length, state.logs.length, "starter logs are copied, not shared");

  const normalized = session.normalizeGameState(state);
  assert.deepEqual(normalized.characters.map((character) => character.id), ids);
  assert.equal(normalized.selectedId, state.selectedId);
});
