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

const CTX = {
  name: "早乙女雪",
  date: "2026-07-29",
  skillTable: { 器术: ["机关术", "火术"], 体术: ["骑乘术", "步法"], 忍术: ["生存术"], 谋术: ["医术"], 战术: ["兵粮术"], 妖术: ["异形化"] },
  decks: { 地点: ["《监控死角》……", "《封锁线内》……", "《雨后的天台》……"], 线索: ["《过于整齐》……"] },
};

test("rh marks the outcome hidden and defaults to 2d6", () => {
  const explicit = dice.rollDiceCommand("rh 3sg>=5", fakeRng([4, 4, 4, 1]), CTX);
  assert.equal(explicit.hidden, true);
  assert.match(explicit.text, /成功|失败/);
  const bare = dice.rollDiceCommand(".rh", fakeRng([2, 3]), CTX);
  assert.equal(bare.hidden, true);
  assert.match(bare.text, /2D6/);
  const cn = dice.rollDiceCommand("暗骰 d66", fakeRng([4, 2]), CTX);
  assert.equal(cn.hidden, true);
});

test("jrrp is stable per name and day and differs across days", () => {
  const one = dice.rollDiceCommand("jrrp", fakeRng([1]), CTX);
  const two = dice.rollDiceCommand("今日人品", fakeRng([6]), CTX);
  assert.equal(one.text, two.text);
  assert.match(one.text, /早乙女雪 的今日人品：\d+／100/);
  const luckA = dice.dailyLuck("早乙女雪", "2026-07-29");
  const luckB = dice.dailyLuck("早乙女雪", "2026-07-30");
  assert.ok(luckA >= 1 && luckA <= 100);
  assert.notEqual(luckA, luckB);
});

test("rtt and rct draw from the injected skill table", () => {
  const rtt = dice.rollDiceCommand("RTT", fakeRng([2, 1]), CTX);
  assert.match(rtt.text, /【体术】→ 1【骑乘术】/);
  const multi = dice.rollDiceCommand("3rtt", fakeRng([1, 1, 2, 2, 3, 1]), CTX);
  assert.match(multi.text, /连抽 3/);
  const rct = dice.rollDiceCommand("随机分野", fakeRng([6]), CTX);
  assert.match(rct.text, /【妖术】/);
  const bare = dice.rollDiceCommand("rtt");
  assert.match(bare.text, /未注入/);
});

test("draw fuzzy-matches deck names and draws without replacement", () => {
  const one = dice.rollDiceCommand("draw 地点", fakeRng([1]), CTX);
  assert.match(one.text, /牌堆【地点】抽出 1 张/);
  const cn = dice.rollDiceCommand("抽 线索", fakeRng([1]), CTX);
  assert.match(cn.text, /过于整齐/);
  const multi = dice.rollDiceCommand("draw 地点 3#", (() => { const q = [0.1, 0.1, 0.1]; return () => q.shift() ?? 0.1; })(), CTX);
  const body = multi.text.split("：")[1];
  const cards = body.split("／");
  assert.equal(new Set(cards).size, 3, "不放回抽取不应重复");
  const missing = dice.rollDiceCommand("draw 忍法", fakeRng([1]), CTX);
  assert.match(missing.text, /没有叫「忍法」的牌堆/);
});

test("multi-round rolls and help are supported", () => {
  const multi = dice.rollDiceCommand("3#2d6", fakeRng([1, 2, 3, 4, 5, 6]), CTX);
  assert.match(multi.text, /连掷 3 轮/);
  assert.match(multi.text, /#3/);
  const help = dice.rollDiceCommand("help");
  assert.match(help.text, /骰娘指令速查/);
  const cnHelp = dice.rollDiceCommand("。帮助");
  assert.equal(cnHelp.kind, "help");
  const bang = dice.rollDiceCommand("!2d6", fakeRng([3, 3]));
  assert.match(bang.text, /＝6/);
});
