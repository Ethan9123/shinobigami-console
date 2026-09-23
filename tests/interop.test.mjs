import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const rulesSource = await readFile(new URL("../app/lib/rules.ts", import.meta.url), "utf8");
const rulesOutput = ts.transpileModule(rulesSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const rulesUrl = `data:text/javascript;base64,${Buffer.from(rulesOutput).toString("base64")}`;
const rules = await import(rulesUrl);

const interopSource = (await readFile(new URL("../app/lib/interop.ts", import.meta.url), "utf8"))
  .replaceAll('"./rules"', `"${rulesUrl}"`);
const interopOutput = ts.transpileModule(interopSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const interop = await import(`data:text/javascript;base64,${Buffer.from(interopOutput).toString("base64")}`);

const character = {
  id: "pc-export",
  name: "月影",
  role: "PC",
  faction: "鞍马神流",
  subFaction: "莲华王拳",
  condition: "守护委托人",
  style: "正面迎敌",
  rank: "中忍",
  player: "测试玩家",
  age: "19",
  gender: "女",
  cover: "转校生",
  belief: "情",
  merit: 2,
  enemy: "雾隐",
  surface: "沉默寡言。",
  story: "在雨夜追查失物。",
  backgrounds: "",
  backgroundItems: [{ id: "bg-1", serial: "1008", name: "未裔", category: "长处（一般）", points: 2, effect: "选择一个忍法。" }],
  portrait: "data:image/png;base64,local-only",
  ougiSkill: "刀术",
  ougiEffect: "範囲攻撃",
  ougiStrength: "强化",
  ougiWeakness: "弱点",
  plot: 4,
  active: true,
  extraLife: 1,
  life: { 器术: true, 体术: true, 忍术: false, 谋术: true, 战术: true, 妖术: true },
  skills: ["刀术", "火术", "潜伏术"],
  ninpoIds: ["close", "blast", "emotion"],
  conditions: ["麻痹"],
  spentCost: 0,
  usedNinpoIds: [],
  mission: "守住秘宝。",
  secret: "其实秘宝是一封信。",
  ougi: "月下无影",
  closedGaps: [true, false, false, false, false],
  acted: false,
  tools: { 兵粮丸: 1, 神通丸: 0, 遁甲符: 2 },
};

test("BCDice palette uses official ShinobiGami command syntax without bundling table prose", () => {
  const palette = interop.createBCDicePalette(character, rules.COMMON_NINPO);

  assert.match(palette, /SG@12#2>=5 【刀术】/);
  // 失去生命力分野的特技不能直接使用：按最近的可用特技代用（火术经涂黑的器术/体术空隙，距离 3）
  assert.match(palette, /SG@12#2>=8 【潜伏术→火术】/);
  assert.doesNotMatch(palette, /SG@12#2>=12 【潜伏术】/);
  assert.match(palette, /SG@12#2>=5 【爆破／火术】/);
  assert.match(palette, /^ET 感情表$/m);
  assert.match(palette, /^RTT 随机特技$/m);
  assert.doesNotMatch(palette, /1D6|2D6|掷骰结果/);
  assert.doesNotMatch(palette, /接近战攻击／自由/, "an unset free skill must not be exported as target 5");
});

test("free ninpo export the designated skill chosen at acquisition", () => {
  const free = { ...character, skills: ["刀术"], closedGaps: [false, false, false, false, false], ninpoIds: ["close", "shoot"], ninpoSkills: { close: "火术", shoot: "刀术" } };
  const palette = interop.createBCDicePalette(free, rules.COMMON_NINPO);
  const distance = rules.skillDistance("刀术", "火术");
  assert.equal(distance, 10);
  assert.ok(palette.includes(`SG@12#2>=${5 + distance} 【接近战攻击／火术→刀术】`), palette);
  assert.match(palette, /SG@12#2>=5 【射击战攻击／刀术】/);

  const foundry = interop.createFoundryActor(free, rules.COMMON_NINPO);
  const close = foundry.items.find((item) => item.type === "ability" && item.name === "接近战攻击");
  assert.equal(close.system.talent, "火术");
  const unset = interop.createFoundryActor({ ...free, ninpoSkills: {} }, rules.COMMON_NINPO);
  assert.equal(unset.items.find((item) => item.name === "接近战攻击").system.talent, "");
});

test("CCFOLIA clipboard export is public by default and opt-in for private notes", () => {
  const safe = interop.createCCFoliaCharacter(character, rules.COMMON_NINPO);
  const privateCopy = interop.createCCFoliaCharacter(character, rules.COMMON_NINPO, { includePrivate: true });

  assert.equal(safe.kind, "character");
  assert.equal(safe.data.name, "月影");
  assert.equal(safe.data.initiative, 4);
  assert.equal(safe.data.iconUrl, "", "local portraits must not be embedded into portable JSON");
  assert.ok(safe.data.status.some((item) => item.label === "忍术" && item.value === 0));
  assert.ok(safe.data.params.some((item) => item.label === "流派" && item.value.includes("莲华王拳")));
  assert.doesNotMatch(safe.data.memo, /其实秘宝|月下无影/);
  assert.match(privateCopy.data.memo, /其实秘宝是一封信/);
  assert.match(privateCopy.data.memo, /月下无影/);
  assert.equal(JSON.parse(interop.serializeInterop(safe)).kind, "character");
});

test("Foundry export follows the Shinobigami Actor and Item schema", () => {
  const safe = interop.createFoundryActor(character, rules.COMMON_NINPO);
  const privateCopy = interop.createFoundryActor(character, rules.COMMON_NINPO, { includePrivate: true });
  const talent = safe.system.talent;
  const health = safe.system.health;

  assert.equal(safe.type, "character");
  assert.equal(talent.table.length, 6);
  assert.ok(talent.table.every((column) => column.length === 11));
  assert.equal(talent.table[1][9].state, true, "刀术 should occupy the 体术 column");
  assert.equal(health.state["2"], true, "lost 忍术 is marked unavailable");
  assert.equal(talent.gap["1"], true, "filled field gap is preserved");
  assert.ok(safe.items.some((item) => item.type === "ability" && item.name === "爆破"));
  assert.ok(safe.items.some((item) => item.type === "background" && item.name === "未裔"));
  assert.ok(safe.items.some((item) => item.type === "item" && item.name === "兵粮丸"));
  assert.ok(safe.items.every((item) => item.type !== "finish" && item.type !== "handout"));
  assert.ok(privateCopy.items.some((item) => item.type === "finish" && item.name === "月下无影"));
  assert.ok(privateCopy.items.some((item) => item.type === "handout" && item.system.secret.includes("一封信")));
});

test("palette and Foundry exports drop paralyzed skills and honor skill table connections", () => {
  const sealed = { ...character, life: { ...character.life, 忍术: true }, paralyzedSkills: ["刀术"] };
  const palette = interop.createBCDicePalette(sealed, rules.COMMON_NINPO);
  const distance = rules.skillDistance("火术", "刀术", sealed.closedGaps);
  assert.ok(palette.includes(`SG@12#2>=${5 + distance} 【刀术→火术】`), palette);
  assert.doesNotMatch(palette, /SG@12#2>=5 【刀术】/);

  const wrapped = {
    ...character,
    life: { 器术: true, 体术: true, 忍术: true, 谋术: true, 战术: true, 妖术: true },
    skills: ["藏兵术"],
    ninpoIds: ["close", "makai-kogaku"],
    ninpoSkills: { close: "封术" },
    closedGaps: [false, false, false, false, false],
    outerGapClosed: true,
  };
  assert.match(interop.createBCDicePalette(wrapped, rules.COMMON_NINPO), /SG@12#2>=6 【接近战攻击／封术→藏兵术】/);
  const foundry = interop.createFoundryActor(wrapped, rules.COMMON_NINPO);
  assert.equal(foundry.system.talent.gap["0"], true, "gap 0 is the outer gap left of 器术");
  assert.equal(foundry.system.talent.table[5][4].num, "6", "封术 is one step away through makai-kogaku");
  assert.equal(interop.createFoundryActor({ ...wrapped, outerGapClosed: false }, rules.COMMON_NINPO).system.talent.gap["0"], false);
});