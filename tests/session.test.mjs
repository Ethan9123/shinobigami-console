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

  assert.equal(migrated.schemaVersion, 8);
  assert.equal(migrated.selectedId, "legacy-pc");
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

  assert.equal(migrated.schemaVersion, 8);
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
});

test("createInitialGameState returns a fresh, internally consistent starter session", () => {
  const state = session.createInitialGameState();
  const ids = state.characters.map((character) => character.id);

  assert.equal(state.schemaVersion, 8);
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
