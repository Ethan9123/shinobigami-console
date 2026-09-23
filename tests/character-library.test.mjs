import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/lib/character-library.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const library = await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);

const character = {
  id: "pc-live",
  name: "雨燕",
  role: "PC",
  faction: "鞍马神流",
  subFaction: "密藏番",
  rank: "中忍",
  backgroundItems: [{ id: "bg-1", serial: "10001", name: "旧伤", category: "短处", points: -1, effect: "摘要" }],
  plot: 5,
  active: false,
  extraLife: 2,
  life: { 器术: false, 体术: true, 忍术: true, 谋术: false, 战术: true, 妖术: true },
  skills: ["刀术", "见敌术"],
  ninpoIds: ["close", "shoot"],
  conditions: ["重伤"],
  spentCost: 3,
  usedNinpoIds: ["close"],
  mission: "回收秘宝",
  secret: "私人秘密",
  ougi: "燕返",
  closedGaps: [false, true, false, false, false],
  acted: true,
  portrait: "data:image/jpeg;base64,large",
  tools: { 兵粮丸: 1, 神通丸: 1, 遁甲符: 0 },
};

test("character library stores reusable build data without live battle state", () => {
  const entries = library.upsertCharacterLibrary([], character, { id: "entry-1", savedAt: "2026-08-12T00:00:00.000Z" });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].character.portrait, "");
  assert.equal(entries[0].character.plot, null);
  assert.equal(entries[0].character.active, true);
  assert.deepEqual(entries[0].character.conditions, []);
  assert.deepEqual(entries[0].character.usedNinpoIds, []);
  assert.ok(Object.values(entries[0].character.life).every(Boolean));
  assert.equal(entries[0].character.secret, "私人秘密", "private notes stay device-local and reusable");
});

test("loading a library entry creates an independent fresh character", () => {
  const [entry] = library.upsertCharacterLibrary([], character, { id: "entry-1", savedAt: "2026-08-12T00:00:00.000Z" });
  const loaded = library.materializeCharacter(entry, "pc-new", "PC");
  loaded.skills.push("走法");
  loaded.backgroundItems[0].name = "changed";

  assert.equal(loaded.id, "pc-new");
  assert.equal(entry.character.skills.includes("走法"), false);
  assert.equal(entry.character.backgroundItems[0].name, "旧伤");
});

test("library keeps free designated skills as build data and tolerates legacy entries", () => {
  const [entry] = library.upsertCharacterLibrary([], { ...character, ninpoSkills: { close: "刀术" } }, { id: "entry-1", savedAt: "2026-08-12T00:00:00.000Z" });
  const loaded = library.materializeCharacter(entry, "pc-new", "PC");
  assert.deepEqual(loaded.ninpoSkills, { close: "刀术" });
  loaded.ninpoSkills.close = "走法";
  assert.equal(entry.character.ninpoSkills.close, "刀术", "the template is not mutated through the loaded copy");

  const [legacy] = library.normalizeCharacterLibrary([{ schemaVersion: 1, id: "old", savedAt: "2026-08-01T00:00:00.000Z", character }]);
  assert.deepEqual(legacy.character.ninpoSkills, {});
});

test("saving the same identity updates instead of duplicating", () => {
  const first = library.upsertCharacterLibrary([], character, { id: "entry-1", savedAt: "2026-08-11T00:00:00.000Z" });
  const second = library.upsertCharacterLibrary(first, { ...character, skills: [...character.skills, "走法"] }, { savedAt: "2026-08-12T00:00:00.000Z" });
  assert.equal(second.length, 1);
  assert.equal(second[0].id, "entry-1");
  assert.equal(second[0].character.skills.includes("走法"), true);
});

test("library clears paralysis seals but keeps the outer gap as build data", () => {
  const [entry] = library.upsertCharacterLibrary([], { ...character, conditions: ["麻痹"], paralyzedSkills: ["刀术"], outerGapClosed: true }, { id: "entry-1", savedAt: "2026-08-12T00:00:00.000Z" });
  assert.deepEqual(entry.character.paralyzedSkills, []);
  assert.deepEqual(entry.character.conditions, []);
  assert.equal(entry.character.outerGapClosed, true);
  const loaded = library.materializeCharacter(entry, "pc-new", "PC");
  assert.deepEqual(loaded.paralyzedSkills, []);
  assert.equal(loaded.outerGapClosed, true);

  const [legacy] = library.normalizeCharacterLibrary([{ schemaVersion: 1, id: "old", savedAt: "2026-08-01T00:00:00.000Z", character }]);
  assert.deepEqual(legacy.character.paralyzedSkills, []);
  assert.equal(legacy.character.outerGapClosed, false);
});