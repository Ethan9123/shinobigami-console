import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("product page replaces the starter preview", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const product = await readFile(new URL("../app/components/ShinobigamiConsole.tsx", import.meta.url), "utf8");
  const chrome = await readFile(new URL("../app/lib/i18n.ts", import.meta.url), "utf8");
  const surface = product + chrome;
  const tutorial = await readFile(new URL("../app/components/tutorial/TutorialRunner.tsx", import.meta.url), "utf8");
  const tutorialData = await readFile(new URL("../app/lib/tutorial.ts", import.meta.url), "utf8");

  assert.match(page, /ShinobigamiConsole/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /og-v17\.png/);
  assert.match(product, /秘密布局|布局阶段/);
  assert.match(product, /BCDice 风格|BCDice STYLE/i);
  assert.match(product, /忍法配置/);
  assert.match(product, /规则速查/);
  assert.match(product, /累计花费/);
  assert.match(surface, /场景导演/);
  assert.match(product, /人物关系与情报流向/);
  assert.match(product, /纯文字角色卡导入/);
  assert.match(product, /Excel／纯文字角色卡导入/);
  assert.match(product, /本地角色库/);
  assert.match(product, /成功率/);
  assert.match(product, /智能提示/);
  assert.match(product, /开团公告与约束/);
  assert.match(product, /本地资料体检/);
  assert.match(product, /当前结算流程/);
  assert.match(product, /MVP 1\.8/);
  assert.match(product, /nav\.academy/);
  assert.match(product, /LOCALES/);
  assert.match(product, /rh 暗骰/);
  assert.match(product, /骰娘/);
  assert.match(product, /快速表骰/);
  assert.match(product, /秘宝/);
  assert.match(product, /实战巡回/);
  assert.match(surface, /角色工作台/);
  assert.match(surface, /跑团记录台/);
  assert.match(surface, /自动 Replay 工房/);
  assert.match(product, /张力曲线/);
  assert.match(product, /送入跑团记录台/);
  assert.match(product, /已装备忍法清单/);
  assert.match(product, /开源团务互通桥/);
  assert.match(product, /CCFOLIA 角色/);
  assert.match(product, /Foundry Actor/);
  assert.match(product, /熟练 GM 导演席/);
  assert.match(product, /失败也前进/);
  assert.match(product, /可直接朗读/);
  assert.match(product, /建议聚光灯/);
  assert.match(product, /场景牌桌/);
  assert.match(product, /局势神谕/);
  assert.match(product, /镜头账本/);
  assert.match(surface + tutorial, /第一次忍务/);
  assert.match(tutorial + tutorialData, /雨夜零号线/);
  assert.match(tutorial, /安全工具/);
  assert.doesNotMatch(page + layout, /codex-preview|SkeletonPreview/);
});

test("check panel state is reset whenever the roller or turn changes", async () => {
  const product = await readFile(new URL("../app/components/ShinobigamiConsole.tsx", import.meta.url), "utf8");
  const handlerBody = (name) => {
    const match = product.match(new RegExp(`const ${name} = \\([^)]*\\) => \\{([\\s\\S]*?)\\n  \\};`));
    assert.ok(match, `${name} handler should exist`);
    return match[1];
  };
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
  assert.doesNotMatch(product, /onClick=\{\(\) => setSelectedId\(/);
});

test("battle and sheet surfaces expose the v1.8 correctness controls", async () => {
  const product = await readFile(new URL("../app/components/ShinobigamiConsole.tsx", import.meta.url), "utf8");
  assert.match(product, /本判定可在逆止中进行/);
  assert.match(product, /逆止：自动失败/);
  assert.match(product, /违规→0/);
  assert.match(product, /布局 0：可无视距离/);
  assert.match(product, /GM 覆盖/);
  assert.match(product, /自由（习得时指定）/);
  assert.match(product, /无（无需判定）/);
  assert.match(product, /"下忍", "下忍头", "中忍"/);
  assert.match(product, /草（NPC 用）/);
});

test("battle-scoped state does not leak past the battle and follows the current actor", async () => {
  const product = await readFile(new URL("../app/components/ShinobigamiConsole.tsx", import.meta.url), "utf8");
  const handlerBody = (name) => {
    const start = product.indexOf(`const ${name} = `);
    assert.notEqual(start, -1, `${name} exists`);
    const next = product.indexOf("\n  const ", start + 1);
    return product.slice(start, next === -1 ? undefined : next);
  };
  // 逆止自动失败只在攻击处理窗口内生效；场景、巡结束时清掉回合状态
  assert.match(product, /const inReversal = hasReversalTag && inAttackWindow/);
  assert.match(product, /「逆止」标签残留在战斗之外/);
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
  assert.match(product, /如需更正请在忍法配置修改/);
  assert.doesNotMatch(product, /之后不可更改/);
});

test("sheet and check panel expose paralysis, skill table topology and specialty controls", async () => {
  const product = await readFile(new URL("../app/components/ShinobigamiConsole.tsx", import.meta.url), "utf8");
  assert.match(product, /usableSkills\(/, "the check panel shares the palette's usable-skill rule");
  assert.match(product, /skillTableOptions\(/);
  assert.match(product, /applyParalysis\(/);
  assert.match(product, /全部解除（身体操术判定成功）/);
  assert.match(product, /麻痹×/);
  assert.match(product, /旧存档未记录被封特技，请补抽/);
  assert.match(product, /麻痹中，已剔除/);
  assert.match(product, /"paralyzed"/);
  assert.match(product, /器术左侧（外）/);
  assert.match(product, /木莲：上下连通/);
  assert.match(product, /魔界工学：左右连通/);
  assert.match(product, /连通）/);
  assert.match(product, /按得意分野涂黑空隙/);
});