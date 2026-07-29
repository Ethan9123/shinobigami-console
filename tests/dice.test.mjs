import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/lib/dice.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const dice = await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);

// 用固定序列伪造 rng：依次弹出预置的骰面（1~6 → (n-1)/6 的区间中点）
function fakeRng(faces, sides = 6) {
  const queue = [...faces];
  return () => ((queue.length ? queue.shift() : 1) - 0.5) / sides;
}

test("plain XdY with modifier reports each die and the total", () => {
  const outcome = dice.rollDiceCommand("2d6+3", fakeRng([4, 5]));
  assert.equal(outcome.kind, "dice");
  assert.match(outcome.text, /2D6\+3/);
  assert.match(outcome.text, /\[4,5\]/);
  assert.match(outcome.text, /＝12/);
  assert.equal(outcome.tone, "roll");
});

test("negative modifier and qq-style prefixes are accepted", () => {
  const outcome = dice.rollDiceCommand(".r 3d10-2", (() => {
    const queue = [2, 7, 9];
    return () => ((queue.shift() ?? 1) - 0.5) / 10;
  })());
  assert.match(outcome.text, /\[2,7,9\]/);
  assert.match(outcome.text, /＝16/);
});

test("d66 reads ascending", () => {
  const outcome = dice.rollDiceCommand("d66", fakeRng([5, 2]));
  assert.equal(outcome.kind, "d66");
  assert.match(outcome.text, /25/);
});

test("sg command applies special, fumble and target thresholds", () => {
  const success = dice.rollDiceCommand("sg>=7", fakeRng([4, 4]));
  assert.match(success.text, /\[?SG@12#2>=7\]?/);
  assert.match(success.text, /成功/);

  const fumble = dice.rollDiceCommand("2sg>=5", fakeRng([1, 1, 2]));
  assert.match(fumble.text, /大失败/);
  assert.equal(fumble.tone, "danger");
  assert.ok(fumble.flavor, "大失败应有骰娘口癖");

  const critical = dice.rollDiceCommand("sg", fakeRng([6, 6, 1]));
  assert.match(critical.text, /大成功/);

  const pool = dice.rollDiceCommand("4SG>=9", fakeRng([2, 6, 5, 3]));
  assert.match(pool.text, /\[2,6,5,3\] 取高 6\+5＝11/);
  assert.match(pool.text, /成功/);
});

test("sg without target reports the raw result", () => {
  const outcome = dice.rollDiceCommand("sg", fakeRng([3, 4]));
  assert.match(outcome.text, /出目 7/);
});

test("emotion table returns a pair and battle tables only give the raw die", () => {
  const et = dice.rollDiceCommand("ET", fakeRng([3]));
  assert.match(et.text, /爱情／嫉妒/);
  const ft = dice.rollDiceCommand("ft", fakeRng([4]));
  assert.match(ft.text, /1D6=4/);
  assert.match(ft.text, /对照规则书/);
  assert.doesNotMatch(ft.text, /生命力|忍法|变调：/);
  const wt = dice.rollDiceCommand("变调表", fakeRng([2]));
  assert.match(wt.text, /对照规则书/);
});

test("nonsense, oversized pools and empty input are rejected", () => {
  assert.equal(dice.rollDiceCommand("念动力拳"), null);
  assert.equal(dice.rollDiceCommand("99d6"), null);
  assert.equal(dice.rollDiceCommand("2d1"), null);
  assert.equal(dice.rollDiceCommand("   "), null);
});

test("interop palette lines paste as-is: trailing labels and notes are ignored", () => {
  const labeled = dice.rollDiceCommand("SG@12#2>=5 【体术】", fakeRng([4, 3]));
  assert.match(labeled.text, /＝7，成功/);
  const inline = dice.rollDiceCommand("3SG@12#2>=9【手里剑】", fakeRng([6, 5, 2]));
  assert.match(inline.text, /取高 6\+5＝11/);
  const et = dice.rollDiceCommand("ET 感情表", fakeRng([1]));
  assert.match(et.text, /共感／不信/);
  const ft = dice.rollDiceCommand("FT ファンブル表", fakeRng([3]));
  assert.match(ft.text, /大失败表出目/);
});

test("explicit out-of-range sg parameters are rejected instead of silently clamped", () => {
  assert.equal(dice.rollDiceCommand("1sg>=5"), null);
  assert.equal(dice.rollDiceCommand("12sg"), null);
  assert.equal(dice.rollDiceCommand("sg@5#8"), null);
  assert.ok(dice.rollDiceCommand("10sg", fakeRng([1,1,1,1,1,1,1,1,1,1,5])));
});

test("prefix edge cases: colon after r, and ret is not stripped into et", () => {
  const colon = dice.rollDiceCommand(".r：2d6", fakeRng([3, 3]));
  assert.match(colon.text, /＝6/);
  assert.equal(dice.rollDiceCommand("ret"), null);
});
