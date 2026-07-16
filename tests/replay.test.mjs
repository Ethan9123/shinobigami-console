import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function importTypeScript(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

const replayModule = await importTypeScript("../app/lib/replay.ts");
const transcriptModule = await importTypeScript("../app/lib/transcript.ts");

const cast = [
  { id: "hero", name: "月影", role: "PC", faction: "鞍马神流", mission: "守住目标并查明真相", secret: "月影曾经背叛委托人", belief: "情", ougi: "月下无影", skills: ["刀术", "见敌术"], ninpoNames: ["接近战攻击", "神枪"] },
  { id: "ally", name: "朝凪", role: "PC", faction: "私立御斋学园", mission: "保护月影", secret: "真正目标是销毁证据", belief: "和", skills: ["调查术"] },
  { id: "rival", name: "雾隐", role: "NPC", faction: "隐忍血统", mission: "夺走秘宝", secret: "雾隐其实是失踪证人", belief: "凶", skills: ["潜伏术"] },
];

const config = {
  title: "追忆",
  genre: "都市悬疑",
  length: "标准",
  ending: "苦涩胜利",
  intensity: 2,
  seed: "tsuioku-01",
  protagonistId: "hero",
  revealSecrets: false,
};

test("same seed reproduces the same dramatic replay", () => {
  const first = replayModule.generateReplay(cast, config);
  const second = replayModule.generateReplay(cast, config);

  assert.equal(first.text, second.text);
  assert.deepEqual(first.scenes, second.scenes);
  assert.equal(first.stats.sceneCount, 7);
  assert.equal(first.stats.peakTension, 100);
  assert.ok(first.scenes[2].tension > first.scenes[3].tension, "the false victory creates a deliberate dip");
  assert.ok(first.scenes[4].tension > first.scenes[3].tension, "the reveal drives tension upward again");
  assert.equal(first.scenes.at(-2).beat, "高潮");
});

test("secrets are opt-in and safe mode compatible", () => {
  const safe = replayModule.generateReplay(cast, config);
  const revealed = replayModule.generateReplay(cast, { ...config, revealSecrets: true });

  assert.doesNotMatch(safe.text, /月影曾经背叛委托人|雾隐其实是失踪证人/);
  assert.match(revealed.text, /月影曾经背叛委托人/);
  assert.match(revealed.text, /雾隐其实是失踪证人/);
  assert.ok(revealed.scenes.some((scene) => scene.lines.some((line) => line.kind === "reveal")));
});

test("generated replay can be opened by the local replay desk", () => {
  const generated = replayModule.generateReplay(cast, config);
  const archive = transcriptModule.parseTranscript(generated.text, "追忆 · 自动 Replay");

  assert.ok(archive.scenes.length >= generated.scenes.length);
  assert.ok(archive.entries.some((entry) => entry.speaker === "月影"));
  assert.ok(archive.entries.some((entry) => entry.kind === "roll"));
  assert.ok(archive.entries.some((entry) => entry.text.includes("场景结束")));
});
