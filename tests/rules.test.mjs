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
