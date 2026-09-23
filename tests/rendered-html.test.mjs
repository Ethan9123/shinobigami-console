import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const componentsUrl = new URL("../app/components/", import.meta.url);

// v1.9 起控制台拆分为 ShinobigamiConsole.tsx 外壳与 app/components/console/** 下的状态、动作和视图组件
async function readTreeFiles(dirUrl) {
  const root = fileURLToPath(dirUrl);
  const entries = await readdir(dirUrl, { recursive: true, withFileTypes: true });
  const paths = entries
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
  return Promise.all(paths.map(async (path) => ({
    path: relative(root, path).split(sep).join("/"),
    source: await readFile(path, "utf8"),
  })));
}

async function readTree(dirUrl) {
  return (await readTreeFiles(dirUrl)).map((file) => file.source).join("\n");
}

async function readConsole() {
  const product = await readFile(new URL("ShinobigamiConsole.tsx", componentsUrl), "utf8");
  const files = await readTreeFiles(componentsUrl);
  const chrome = await readFile(new URL("../app/lib/i18n.ts", import.meta.url), "utf8");
  const hints = await readFile(new URL("../app/lib/hints.ts", import.meta.url), "utf8");
  const components = await readTree(componentsUrl);
  const surface = [components, chrome, hints].join("\n");
  return { product, files, components, surface };
}

// 处理函数可能在任意文件、任意缩进层级：按声明行的缩进找到同级的结束括号
function arrowHandlerBody(files, name) {
  const pattern = new RegExp(`\\n([ \\t]*)const ${name} = \\([^)]*\\) => \\{([\\s\\S]*?)\\n\\1\\};`);
  const match = files.map(({ source }) => source.match(pattern)).find(Boolean);
  assert.ok(match, `${name} handler should exist`);
  return match[2];
}

// 从声明截取到下一个同级 const 声明
function handlerSlice(files, name) {
  const pattern = new RegExp(`\\n([ \\t]*)const ${name} = `);
  const file = files.find(({ source }) => pattern.test(source));
  assert.ok(file, `${name} exists`);
  const match = pattern.exec(file.source);
  const start = match.index + 1;
  const next = file.source.indexOf(`\n${match[1]}const `, start + 1);
  return file.source.slice(start, next === -1 ? undefined : next);
}

test("product page replaces the starter preview", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const { components, surface } = await readConsole();
  const tutorial = await readFile(new URL("../app/components/tutorial/TutorialRunner.tsx", import.meta.url), "utf8");
  const tutorialData = await readFile(new URL("../app/lib/tutorial.ts", import.meta.url), "utf8");

  assert.match(page, /ShinobigamiConsole/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /og-v17\.png/);
  assert.match(surface, /秘密布局|布局阶段/);
  assert.match(surface, /BCDice 风格|BCDice STYLE/i);
  assert.match(surface, /忍法配置/);
  assert.match(surface, /规则速查/);
  assert.match(surface, /累计花费/);
  assert.match(surface, /场景导演/);
  assert.match(surface, /人物关系与情报流向/);
  assert.match(surface, /纯文字角色卡导入/);
  assert.match(surface, /Excel／纯文字角色卡导入/);
  assert.match(surface, /本地角色库/);
  assert.match(surface, /成功率/);
  assert.match(surface, /智能提示/);
  assert.match(surface, /开团公告与约束/);
  assert.match(surface, /本地资料体检/);
  assert.match(surface, /当前结算流程/);
  assert.match(surface, /MVP 1\.8\.0/);
  // i18n.ts 自带这两个标识，只能对组件树断言，才能确认学院页签和语言切换确实被渲染
  assert.match(components, /nav\.academy/);
  assert.match(components, /LOCALES\.map/);
  assert.match(surface, /rh 暗骰/);
  assert.match(surface, /骰娘/);
  assert.match(surface, /快速表骰/);
  assert.match(surface, /秘宝/);
  assert.match(surface, /实战巡回/);
  assert.match(surface, /角色工作台/);
  assert.match(surface, /跑团记录台/);
  assert.match(surface, /自动 Replay 工房/);
  assert.match(surface, /张力曲线/);
  assert.match(surface, /送入跑团记录台/);
  assert.match(surface, /已装备忍法清单/);
  assert.match(surface, /开源团务互通桥/);
  assert.match(surface, /CCFOLIA 角色/);
  assert.match(surface, /Foundry Actor/);
  assert.match(surface, /熟练 GM 导演席/);
  assert.match(surface, /失败也前进/);
  assert.match(surface, /可直接朗读/);
  assert.match(surface, /建议聚光灯/);
  assert.match(surface, /场景牌桌/);
  assert.match(surface, /局势神谕/);
  assert.match(surface, /镜头账本/);
  assert.match(surface + tutorial, /第一次忍务/);
  assert.match(tutorial + tutorialData, /雨夜零号线/);
  assert.match(tutorial, /安全工具/);
  assert.doesNotMatch(page + layout, /codex-preview|SkeletonPreview/);
});

test("console shell stays a thin provider over the split view components", async () => {
  const { product, files } = await readConsole();
  const lines = product.split("\n").length;
  assert.ok(lines < 200, `ShinobigamiConsole.tsx should stay under 200 lines (has ${lines})`);
  assert.match(product, /^"use client";/);
  assert.match(product, /export default function ShinobigamiConsole\(/);
  assert.match(product, /useConsoleController\(\)/);
  assert.match(product, /import \{ ConsoleContext \} from "\.\/console\/context";/);
  assert.match(product, /<ConsoleContext\.Provider value=\{/);
  const guard = product.indexOf("if (!selected) return null;");
  assert.ok(guard !== -1, "the selected-character guard stays in the shell");
  assert.ok(guard < product.indexOf("<ConsoleContext.Provider"), "the guard runs before any view renders");

  const viewFiles = files.filter(({ path }) => /^console\/(shell|side|views)\//.test(path));
  assert.ok(viewFiles.length >= 20, "views, shell and side panels live in their own files");
  for (const { path, source } of viewFiles) {
    assert.doesNotMatch(source, /useConsoleController/, `${path} reads state through the console context, not a second controller`);
  }
  // 设备本地存储只允许由 store 读写
  for (const { path, source } of files) {
    if (path.startsWith("console/store/")) continue;
    assert.doesNotMatch(source, /localStorage/, `${path} must not touch localStorage directly`);
  }
  // 下拉选项必须显式提交 value，不能依赖显示文本
  for (const { path, source } of files) {
    assert.doesNotMatch(source, /<option(?![^>]*value=)[^>]*>/, `${path} has an <option> without a value attribute`);
  }
});

test("check panel state is reset whenever the roller or turn changes", async () => {
  const { files, surface } = await readConsole();
  const handlerBody = (name) => arrowHandlerBody(files, name);
  for (const handler of ["declareNinpo", "beginDefense", "advanceTurn", "newRound", "selectCharacter"]) {
    assert.match(handlerBody(handler), /resetCheckPanel\(\)/, `${handler} must reset the check panel`);
  }
  assert.match(handlerBody("resetCheckPanel"), /freshCheckInputs\(\)/);
  assert.match(handlerBody("beginDefense"), /evasionSkill\(resolution\)/, "evasion anchors to the attack's designated skill");
  assert.match(handlerBody("declareNinpo"), /尚未指定特技/);
  assert.match(handlerBody("declareNinpo"), /canDeclareAttack\(/);
  assert.match(handlerBody("declareNinpo"), /battleTargetCheck\(/);
  assert.match(handlerBody("rollCheck"), /resolveCheckOutcome\(/);
  // 角色栏与布局栏点选角色走同一个入口
  assert.doesNotMatch(surface, /onClick=\{\(\) => setSelectedId\(/);
});

test("battle and sheet surfaces expose the v1.8 correctness controls", async () => {
  const { surface } = await readConsole();
  assert.match(surface, /本判定可在逆止中进行/);
  assert.match(surface, /逆止：自动失败/);
  assert.match(surface, /违规→0/);
  assert.match(surface, /布局 0：可无视距离/);
  assert.match(surface, /GM 覆盖/);
  assert.match(surface, /自由（习得时指定）/);
  assert.match(surface, /无（无需判定）/);
  assert.match(surface, /"下忍", "下忍头", "中忍"/);
  assert.match(surface, /草（NPC 用）/);
});

test("battle-scoped state does not leak past the battle and follows the current actor", async () => {
  const { files, surface } = await readConsole();
  const handlerBody = (name) => handlerSlice(files, name);
  // 逆止自动失败只在攻击处理窗口内生效；场景、巡结束时清掉回合状态
  assert.match(surface, /const inReversal = hasReversalTag && inAttackWindow/);
  assert.match(surface, /「逆止」标签残留在战斗之外/);
  for (const handler of ["completeScene", "newCycle", "newRound"]) {
    assert.match(handlerBody(handler), /clearBattleRoundState/, `${handler} clears round-scoped state`);
  }
  // 行动顺序变化时重新定位当前行动者
  assert.match(handlerBody("toggleActive"), /reanchorTurn\(/);
  assert.match(handlerBody("setPlot"), /reanchorTurn\(/);
  // 宣言支援忍法时用其花费抬高大失败值；指定特技「无」的忍法跳过命中判定
  assert.match(handlerBody("declareNinpo"), /setSupportCostInput\(selectedNinpo\.cost\)/);
  assert.match(handlerBody("declareNinpo"), /designation\.noCheck/);
  // 导入后封锁记录清空时一并解除麻痹标签
  assert.match(handlerBody("applyCharacterImport"), /paralyzedBefore\.length && !paralyzedAfter\.length/);
  assert.match(surface, /如需更正请在忍法配置修改/);
  assert.doesNotMatch(surface, /之后不可更改/);
});

test("sheet and check panel expose paralysis, skill table topology and specialty controls", async () => {
  const { surface } = await readConsole();
  assert.match(surface, /usableSkills\(/, "the check panel shares the palette's usable-skill rule");
  assert.match(surface, /skillTableOptions\(/);
  assert.match(surface, /applyParalysis\(/);
  assert.match(surface, /全部解除（身体操术判定成功）/);
  assert.match(surface, /麻痹×/);
  assert.match(surface, /旧存档未记录被封特技，请补抽/);
  assert.match(surface, /麻痹中，已剔除/);
  assert.match(surface, /"paralyzed"/);
  assert.match(surface, /器术左侧（外）/);
  assert.match(surface, /木莲：上下连通/);
  assert.match(surface, /魔界工学：左右连通/);
  assert.match(surface, /连通）/);
  assert.match(surface, /按得意分野涂黑空隙/);
});
