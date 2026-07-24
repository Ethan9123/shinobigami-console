import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/lib/gm.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const gm = await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);

const life = (remaining = 6) => Object.fromEntries(["器术", "体术", "忍术", "谋术", "战术", "妖术"].map((field, index) => [field, index < remaining]));

const characters = [
  { id: "pc-1", name: "月影", role: "PC", active: true, acted: true, mission: "守住秘宝", belief: "情", conditions: [], extraLife: 0, life: life(6) },
  { id: "pc-2", name: "朝凪", role: "PC", active: true, acted: false, mission: "查清真相", belief: "律", conditions: [], extraLife: 0, life: life(6) },
  { id: "npc-1", name: "雾隐", role: "NPC", active: true, acted: false, mission: "", belief: "凶", conditions: [], extraLife: 0, life: life(6) },
];

function input(patch = {}) {
  return {
    title: "追忆",
    cycle: 1,
    sceneNumber: 2,
    sceneOwnerId: "pc-1",
    sceneParticipantIds: ["pc-1", "npc-1"],
    sceneAction: "未定",
    characters,
    emotions: [],
    intel: [],
    trackers: [{ id: "clock", name: "列车到站", value: 1, max: 6 }],
    cues: [],
    beat: "定调",
    pressure: 1,
    tableSafe: false,
    ...patch,
  };
}

test("GM spotlight favors a PC who has not acted yet", () => {
  const brief = gm.createGmBrief(input());

  assert.equal(brief.spotlight.id, "pc-2");
  assert.match(brief.spotlight.reason, /仍在等待/);
  assert.equal(brief.suggestedAction, "情报判定");
});

test("a wounded spotlight receives a recovery suggestion before other scene actions", () => {
  const wounded = characters.map((character) => character.id === "pc-2" ? { ...character, life: life(3) } : character);
  const brief = gm.createGmBrief(input({ characters: wounded }));

  assert.equal(brief.suggestedAction, "回复判定");
  assert.match(brief.failure, /仍然推进/);
});

test("fail-forward notes keep the story moving without changing a roll result", () => {
  const brief = gm.createGmBrief(input({ sceneAction: "情报判定", beat: "抉择" }));
  const note = gm.composeGmNote(brief, "failure");

  assert.match(note, /失败也前进/);
  assert.match(note, /核心线索/);
  assert.match(note, /剧情代价/);
  assert.doesNotMatch(note, /判定成功|改为成功/);
});

test("table-safe mode hides due cue contents while retaining the reminder", () => {
  const cue = { id: "secret-cue", title: "公开隐藏的血缘关系", cycle: 1, scene: 1, done: false };
  const visible = gm.createGmBrief(input({ cues: [cue] }));
  const safe = gm.createGmBrief(input({ cues: [cue], tableSafe: true }));

  assert.match(visible.privateCue, /隐藏的血缘关系/);
  assert.doesNotMatch(safe.privateCue, /血缘关系/);
  assert.match(safe.privateCue, /切回 GM 视图/);
});

test("pressure, clocks and battle reliably increase scene tension", () => {
  const quiet = gm.createGmBrief(input({ pressure: 0, trackers: [{ id: "clock", name: "列车到站", value: 0, max: 6 }] }));
  const urgent = gm.createGmBrief(input({ pressure: 3, sceneAction: "战斗", trackers: [{ id: "clock", name: "列车到站", value: 5, max: 6 }] }));
  const repeat = gm.createGmBrief(input({ pressure: 3, sceneAction: "战斗", trackers: [{ id: "clock", name: "列车到站", value: 5, max: 6 }] }));

  assert.ok(urgent.tension > quiet.tension);
  assert.equal(urgent.tensionLabel, "临界");
  assert.equal(urgent.complication, repeat.complication, "the same scene state should reproduce the same direction");
});
