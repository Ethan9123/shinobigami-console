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
  title: "雾町夜话",
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
  const archive = transcriptModule.parseTranscript(generated.text, "雾町夜话 · 自动 Replay");

  assert.ok(archive.scenes.length >= generated.scenes.length);
  assert.ok(archive.entries.some((entry) => entry.speaker === "月影"));
  assert.ok(archive.entries.some((entry) => entry.kind === "roll"));
  assert.ok(archive.entries.some((entry) => entry.text.includes("场景结束")));
});

const campaignConfig = { ...config, mode: "实战巡回", seed: "junkai-01" };

test("campaign mode reproduces identical output for the same seed", () => {
  const first = replayModule.generateReplay(cast, campaignConfig);
  const second = replayModule.generateReplay(cast, campaignConfig);

  assert.equal(first.text, second.text);
  assert.deepEqual(first.scenes, second.scenes);
  assert.equal(first.schemaVersion, 2);
  assert.equal(first.stats.cycleCount, 3);
  assert.equal(first.stats.peakTension, 100);
  assert.ok(first.text.includes("场景表：1D6"));
  assert.ok(first.text.includes("解放奥义【月下无影】"));
  assert.ok(first.text.includes("奥义破解"));
  assert.ok(first.text.includes("获得变调【"));
  assert.ok(first.text.includes("巡·场景"));
});

test("campaign mode gives every PC a spotlight and covers key scene types", () => {
  const replay = replayModule.generateReplay(cast, campaignConfig);

  for (const pc of cast.filter((member) => member.role === "PC")) {
    assert.ok(replay.scenes.some((scene) => scene.spotlightId === pc.id), `${pc.name} should hold at least one spotlight`);
  }
  for (const type of ["导入", "感情", "情报", "主持人", "高潮", "后日谈"]) {
    assert.ok(replay.scenes.some((scene) => scene.sceneType === type), `missing scene type ${type}`);
  }
  const cycles = new Map();
  for (const scene of replay.scenes) {
    if (!scene.cycle || scene.sceneType === "主持人") continue;
    if (!cycles.has(scene.cycle)) cycles.set(scene.cycle, []);
    cycles.get(scene.cycle).push(scene.sceneType);
  }
  assert.equal(cycles.size, 3);
  for (const [cycle, types] of cycles) {
    assert.ok(types.includes("感情"), `cycle ${cycle} needs a bond scene`);
    assert.ok(types.includes("情报"), `cycle ${cycle} needs an intel scene`);
  }
  const masterScenes = replay.scenes.filter((scene) => scene.sceneType === "主持人");
  for (const master of masterScenes) {
    const siblings = replay.scenes.filter((scene) => scene.cycle === master.cycle && scene.sceneType !== "主持人");
    assert.ok(siblings.every((scene) => scene.tension < master.tension), "master scene raises the tension in its cycle");
  }
  assert.ok(replay.scenes.filter((scene) => scene.sceneType === "后日谈").length >= 2);
});

test("campaign mode keeps secrets out of the text unless revealed", () => {
  const safe = replayModule.generateReplay(cast, campaignConfig);
  for (const member of cast) {
    assert.ok(!safe.text.includes(member.secret), `${member.name} secret must stay hidden`);
  }
  assert.ok(!safe.scenes.some((scene) => scene.lines.some((line) => line.kind === "reveal")));

  const revealed = replayModule.generateReplay(cast, { ...campaignConfig, revealSecrets: true });
  assert.ok(revealed.scenes.some((scene) => scene.lines.some((line) => line.kind === "reveal")));
  assert.match(revealed.text, /【秘密】/);
});

test("normalizeGeneratedReplay accepts schemaVersion 1 archives untouched", () => {
  const legacy = {
    schemaVersion: 1,
    title: "旧档",
    seed: "legacy-seed",
    createdAt: "2025-01-01T00:00:00.000Z",
    config,
    scenes: [],
    text: "《旧档》自动 Replay",
    stats: { sceneCount: 0, lineCount: 0, rollCount: 0, successes: 0, peakTension: 0 },
  };
  const normalized = replayModule.normalizeGeneratedReplay(legacy);
  assert.ok(normalized);
  assert.equal(normalized.schemaVersion, 1);
  assert.equal(normalized.title, "旧档");

  const modern = replayModule.generateReplay(cast, campaignConfig);
  assert.ok(replayModule.normalizeGeneratedReplay(JSON.parse(JSON.stringify(modern))));
  assert.equal(replayModule.normalizeGeneratedReplay({ ...legacy, schemaVersion: 3 }), null);
});

test("campaign mode avoids duplicated sentence-ending punctuation and varies epilogues by belief", () => {
  const beliefCast = [
    { id: "pc1", name: "砂岛铁心", role: "PC", faction: "隐忍血统", mission: "夺回族中信物。", secret: "其实是养子", belief: "凶", skills: ["绳术"], ninpoNames: ["接近战攻击"] },
    { id: "pc2", name: "苇原雪乃", role: "PC", faction: "私立御斋学园", mission: "调查异变！", secret: "组织的继承人", belief: "和", skills: ["调查术"], ninpoNames: ["接近战攻击"] },
    { id: "npc1", name: "无面守", role: "NPC", faction: "妖魔", mission: "迎接黎明", secret: "核心藏于旧伤", belief: "凶", skills: ["异形化"], ninpoNames: ["接近战攻击"] },
  ];
  const config = { title: "标点与后日谈", genre: "都市悬疑", length: "标准", ending: "苦涩胜利", intensity: 2, seed: "punct-1", protagonistId: "pc1", revealSecrets: false, mode: "实战巡回" };
  const generated = replayModule.generateReplay(beliefCast, config);
  assert.doesNotMatch(generated.text, /。。/);
  assert.doesNotMatch(generated.text, /！。/);
  const epilogues = generated.scenes.filter((scene) => scene.sceneType === "后日谈");
  assert.equal(epilogues.length, 2);
  const quotes = epilogues.map((scene) => scene.lines.find((line) => line.kind === "dialogue")?.text);
  assert.ok(quotes[0] && quotes[1], "每幕后日谈都应有 PC 台词");
  assert.notEqual(quotes[0], quotes[1], "不同信念的 PC 后日谈台词不应相同");
});
