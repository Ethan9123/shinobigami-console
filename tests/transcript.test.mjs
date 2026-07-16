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
    "<GM 梅林>夜雨落在屋檐上。",
    "<赤无 凉>我接受任务。",
    "2D6>=6 判定成功",
    "场景结束",
    "第一巡",
    "<赤无 凉>开始调查。",
  ].join("\n"), "追忆-log");

  assert.equal(parsed.sourceName, "追忆-log");
  assert.equal(parsed.entries.length, 8);
  assert.ok(parsed.scenes.length >= 4);
  assert.equal(parsed.speakers.find((speaker) => speaker.name === "赤无 凉").count, 2);
  assert.equal(parsed.entries.find((entry) => entry.text.includes("判定成功")).kind, "roll");
  assert.equal(parsed.entries.find((entry) => entry.text.includes("夜雨")).sceneId, parsed.scenes[1].id);
});

test("archive normalizer rejects malformed external data", () => {
  assert.equal(transcript.normalizeTranscriptArchive({}), null);
  assert.equal(transcript.normalizeTranscriptArchive({ entries: [], scenes: [] }), null);
});
