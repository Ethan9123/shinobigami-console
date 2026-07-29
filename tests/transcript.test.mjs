import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/lib/transcript.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const transcript = await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);

test("forum replay text is split into scenes, speakers and rolls", () => {
  const parsed = transcript.parseTranscript([
    "导入阶段",
    "导入场景：召集",
    "<GM风见>夜雨落在屋檐上。",
    "<早乙女雪>我接受任务。",
    "2D6>=6 判定成功",
    "场景结束",
    "第一巡",
    "<早乙女雪>开始调查。",
  ].join("\n"), "雾町夜话-log");

  assert.equal(parsed.sourceName, "雾町夜话-log");
  assert.equal(parsed.entries.length, 8);
  assert.ok(parsed.scenes.length >= 4);
  assert.equal(parsed.speakers.find((speaker) => speaker.name === "早乙女雪").count, 2);
  assert.equal(parsed.entries.find((entry) => entry.text.includes("判定成功")).kind, "roll");
  assert.equal(parsed.entries.find((entry) => entry.text.includes("夜雨")).sceneId, parsed.scenes[1].id);
});

test("archive normalizer rejects malformed external data", () => {
  assert.equal(transcript.normalizeTranscriptArchive({}), null);
  assert.equal(transcript.normalizeTranscriptArchive({ entries: [], scenes: [] }), null);
});

test("colon dialogue lines register speakers with both colon widths", () => {
  const parsed = transcript.parseTranscript([
    "GM风见：夜色渐深，旅店里只剩一盏烛火。",
    "早乙女雪 : 我先去看看后门。",
    "　黑羽　：　交给我断后。",
  ].join("\n"));

  assert.equal(parsed.entries.length, 3);
  for (const entry of parsed.entries) assert.equal(entry.kind, "dialogue");
  assert.equal(parsed.speakers.find((speaker) => speaker.name === "GM风见").count, 1);
  assert.equal(parsed.speakers.find((speaker) => speaker.name === "早乙女雪").count, 1);
  assert.equal(parsed.speakers.find((speaker) => speaker.name === "黑羽").count, 1);
  assert.equal(parsed.entries[2].speaker, "黑羽");
  assert.equal(parsed.entries[2].text, "交给我断后。");
});

test("dice echo lines are rolls even with a speaker prefix", () => {
  const parsed = transcript.parseTranscript([
    "早乙女雪 : 2D6 (2D6) ＞ 8[2,6] ＞ 8",
    "黑羽：2D6+3 (2D6+3) ＞ 9[4,5]+3 ＞ 12",
    "GM风见 : ET 感情表(2) ＞ ……",
    "rtt ランダム指定特技表(6,7) ＞ ……",
    "WT 変調表(3) ＞ ……",
    "1D6 (1D6) ＞ 3",
  ].join("\n"));

  for (const entry of parsed.entries) assert.equal(entry.kind, "roll");
  assert.equal(parsed.entries[0].speaker, "早乙女雪");
  assert.equal(parsed.speakers.find((speaker) => speaker.name === "早乙女雪").count, 1);
  assert.equal(parsed.speakers.find((speaker) => speaker.name === "黑羽").count, 1);
});

test("loop, host and epilogue headings each open a new scene", () => {
  const parsed = transcript.parseTranscript([
    "第一循环，第二场景",
    "黑羽：从屋顶潜入。",
    "第三循环第四场景",
    "早乙女雪：换我上。",
    "主持人场景：夜袭",
    "GM风见：铃声在巷口响起。",
    "后日谈：归途",
    "早乙女雪：任务总算结束了。",
  ].join("\n"));

  assert.equal(parsed.scenes.length, 4);
  assert.equal(parsed.scenes[0].title, "第一循环，第二场景");
  assert.equal(parsed.scenes[1].title, "第三循环第四场景");
  assert.equal(parsed.scenes[2].title, "主持人场景：夜袭");
  assert.equal(parsed.scenes[3].title, "后日谈：归途");
  assert.equal(parsed.entries[0].kind, "scene");
  assert.equal(parsed.entries[5].sceneId, parsed.scenes[2].id);
});

test("channel prefixes are stripped before parsing the rest", () => {
  const parsed = transcript.parseTranscript([
    "[閒聊] 黑羽：稍微休息一下。",
    "[闲聊] GM风见 : 回到正题。",
    "[main] 2D6 (2D6) ＞ 5[2,3] ＞ 5",
  ].join("\n"));

  assert.equal(parsed.entries[0].kind, "dialogue");
  assert.equal(parsed.entries[0].speaker, "黑羽");
  assert.equal(parsed.entries[0].text, "稍微休息一下。");
  assert.equal(parsed.entries[1].speaker, "GM风见");
  assert.equal(parsed.entries[2].kind, "roll");
});

test("status change lines with arrows become system entries", () => {
  const parsed = transcript.parseTranscript([
    "system : [ 黑羽 ] 器术 : 1 → 0",
    "[ 早乙女雪 ] HP : 20 → 19",
    "SYSTEM : 战斗开始",
  ].join("\n"));

  for (const entry of parsed.entries) assert.equal(entry.kind, "system");
  assert.equal(parsed.entries[0].speaker, "system");
  assert.equal(parsed.entries[1].speaker, "");
  assert.equal(parsed.speakers.length, 0);
});

test("declared game moves become action entries", () => {
  const parsed = transcript.parseTranscript([
    "黑羽：宣言奥义破解",
    "早乙女雪 : 使用苍月丸",
    "GM风见：登场",
    "黑羽：这可不是宣言哦。",
  ].join("\n"));

  assert.equal(parsed.entries[0].kind, "action");
  assert.equal(parsed.entries[1].kind, "action");
  assert.equal(parsed.entries[2].kind, "action");
  assert.equal(parsed.entries[3].kind, "dialogue");
  assert.equal(parsed.speakers.find((speaker) => speaker.name === "黑羽").count, 2);
});

test("spoiler fold markers stay system and do not open scenes", () => {
  const parsed = transcript.parseTranscript([
    "导入阶段",
    "剧透 -   :",
    "剧透 - :",
    "GM风见：故事从雨夜开始。",
  ].join("\n"));

  assert.equal(parsed.scenes.length, 1);
  assert.equal(parsed.entries[1].kind, "system");
  assert.equal(parsed.entries[2].kind, "system");
  assert.equal(parsed.entries[1].sceneId, parsed.scenes[0].id);
});

test("archive normalizer keeps entries with the action kind", () => {
  const archive = transcript.normalizeTranscriptArchive({
    sourceName: "回放",
    importedAt: "",
    truncated: false,
    entries: [{ id: "line-1", line: 1, sceneId: "scene-1", speaker: "黑羽", text: "宣言奥义破解", kind: "action" }],
    scenes: [{ id: "scene-1", title: "导入阶段", startLine: 1, entryCount: 1 }],
    speakers: [{ name: "黑羽", count: 1 }],
  });

  assert.ok(archive);
  assert.equal(archive.entries[0].kind, "action");
});
