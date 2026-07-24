import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/lib/director.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const director = await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);

const deckInput = {
  title: "追忆",
  cycle: 2,
  sceneNumber: 3,
  action: "情报判定",
  tension: 61,
  spotlightName: "朝凪",
};

test("scene deck always supplies one actionable card of each kind", () => {
  const deck = director.generateSceneDeck(deckInput, 0);

  assert.deepEqual(deck.map((card) => card.kind), ["地点", "动静", "线索", "代价"]);
  assert.ok(deck.every((card) => card.title && card.body && card.prompt));
});

test("scene deck is reproducible and rerolls every unlocked slot", () => {
  const first = director.generateSceneDeck(deckInput, 0);
  const repeat = director.generateSceneDeck(deckInput, 0);
  const reroll = director.generateSceneDeck(deckInput, 1);

  assert.deepEqual(first, repeat);
  assert.ok(first.every((card, index) => card.title !== reroll[index].title));
});

test("oracle likelihood adjusts the same underlying 2D6 situation roll", () => {
  const base = { question: "目标仍在附近吗？", tension: 55, seed: "same-scene" };
  const unlikely = director.askSceneOracle({ ...base, likelihood: "不太可能" });
  const likely = director.askSceneOracle({ ...base, likelihood: "很可能" });

  assert.deepEqual(unlikely.dice, likely.dice);
  assert.equal(likely.score - unlikely.score, 2);
  assert.ok(unlikely.score >= 2 && likely.score <= 12);
});

test("spotlight ledger derives stable scene shares from completed-scene logs", () => {
  const characters = [
    { id: "a", name: "朝凪", role: "PC" },
    { id: "b", name: "御影", role: "PC" },
    { id: "n", name: "雾隐", role: "NPC" },
  ];
  const logs = [
    { tone: "action", text: "第 1 巡第 1 场完成：朝凪 进行了情报判定。" },
    { tone: "action", text: "第 1 巡第 2 场完成：朝凪 进行了感情判定。" },
    { tone: "action", text: "第 1 巡第 3 场完成：御影 进行了回复判定。" },
    { tone: "system", text: "聚光灯交给御影。" },
  ];

  const ledger = director.calculateSpotlightLedger(characters, logs);

  assert.deepEqual(ledger.map((entry) => entry.scenes), [2, 1]);
  assert.deepEqual(ledger.map((entry) => entry.share), [67, 33]);
});
