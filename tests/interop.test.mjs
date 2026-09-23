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
  assert.match(palette, /SG@12#2>=12 【潜伏术】/);
  assert.match(palette, /SG@12#2>=5 【爆破／火术】/);
  assert.match(palette, /^ET 感情表$/m);
  assert.match(palette, /^RTT 随机特技$/m);
  assert.doesNotMatch(palette, /1D6|2D6|掷骰结果/);
});

test("CCFOLIA clipboard export is public by default and opt-in for private notes", () => {
  const safe = interop.createCCFoliaCharacter(character, rules.COMMON_NINPO);
  const privateCopy = interop.createCCFoliaCharacter(character, rules.COMMON_NINPO, { includePrivate: true });

  assert.equal(safe.kind, "character");
  assert.equal(safe.data.name, "月影");
  assert.equal(safe.data.initiative, 4);
  assert.equal(safe.data.iconUrl, "", "local portraits must not be embedded into portable JSON");
  assert.ok(safe.data.status.some((item) => item.label === "忍术" && item.value === 0));
  assert.deepEqual(safe.data.status.at(-1), { label: "追加生命力", value: 1, max: 1 });
  const noExtra = interop.createCCFoliaCharacter({ ...character, extraLife: 0 }, rules.COMMON_NINPO);
  assert.equal(noExtra.data.status.length, 6);
  assert.ok(noExtra.data.status.every((item) => item.label !== "追加生命力"));
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
