import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function importTS(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

const { buildSmartHints } = await importTS("../app/lib/hints.ts");

function character(overrides = {}) {
  return {
    id: "pc-a",
    name: "月影",
    role: "PC",
    active: true,
    acted: false,
    plot: null,
    spentCost: 0,
    conditions: [],
    paralyzedSkills: [],
    mission: "守住目标",
    ...overrides,
  };
}

function input(overrides = {}) {
  const hero = character();
  return {
    characters: [hero],
    phase: "导入",
    prepBlockers: [],
    prepWarningCount: 0,
    sceneParticipantIds: [hero.id],
    sceneOwnerId: hero.id,
    sceneAction: "情报判定",
    battleOrder: [hero],
    revealed: false,
    resolution: null,
    resolutionActorName: undefined,
    availableSkillCount: 3,
    selected: hero,
    dueCues: [],
    tableSafe: false,
    ...overrides,
  };
}

const titles = (hints) => hints.map((hint) => hint.title);

test("intro phase reports the preflight gate", () => {
  const blocked = buildSmartHints(input({
    prepBlockers: [
      { code: "a", level: "blocker", message: "PC1 尚未分配给有效 PC。" },
      { code: "b", level: "blocker", message: "月影 尚未确认秘密。" },
      { code: "c", level: "blocker", message: "第三项" },
      { code: "d", level: "blocker", message: "第四项不应出现" },
    ],
  }));
  assert.deepEqual(blocked[0], { tone: "danger", title: "4 项开团阻塞", detail: "PC1 尚未分配给有效 PC。；月影 尚未确认秘密。；第三项" });

  const warned = buildSmartHints(input({ prepWarningCount: 2 }));
  assert.deepEqual(warned[0], { tone: "good", title: "开团门禁已通过", detail: "仍有 2 项可由 GM 确认的提醒。" });

  const clean = buildSmartHints(input());
  assert.deepEqual(clean, [{ tone: "good", title: "开团门禁已通过", detail: "公告、PC 位与角色卡均已确认。" }]);
});

test("main phase tracks who has acted, the scene owner and the main action", () => {
  const hero = character();
  const ally = character({ id: "pc-b", name: "雾隐" });
  const npc = character({ id: "npc", name: "敌人", role: "NPC" });
  const hints = buildSmartHints(input({
    phase: "主要",
    characters: [hero, ally, npc],
    sceneParticipantIds: [ally.id],
    sceneOwnerId: hero.id,
    sceneAction: "未定",
  }));
  assert.deepEqual(hints.slice(0, 3), [
    { tone: "warn", title: "2 位尚未行动", detail: "月影、雾隐" },
    { tone: "danger", title: "场景玩家未登场", detail: "将场景玩家加入登场人物后再完成场景。" },
    { tone: "warn", title: "尚未选择主要行动", detail: "回复、情报、感情、战斗或计划判定只能择一作为主要行动。" },
  ]);

  const done = buildSmartHints(input({ phase: "主要", characters: [character({ acted: true }), npc] }));
  assert.deepEqual(done, [{ tone: "good", title: "本巡行动已完成", detail: "可以结算巡末效果并开始新巡。" }]);
});

test("climax phase flags missing plots and same-plot ties only after reveal", () => {
  const a = character({ plot: 4 });
  const b = character({ id: "pc-b", name: "雾隐", plot: 4 });
  const c = character({ id: "npc", name: "敌人", role: "NPC", plot: null });
  const hidden = buildSmartHints(input({ phase: "高潮", characters: [a, b, c], battleOrder: [a, b, c], selected: a }));
  assert.deepEqual(hidden[0], { tone: "danger", title: "布局尚未齐全", detail: "敌人" });
  assert.ok(!titles(hidden).includes("存在同布局角色"));

  const revealed = buildSmartHints(input({ phase: "高潮", characters: [a, b], battleOrder: [a, b], revealed: true, selected: a }));
  assert.deepEqual(revealed, [{ tone: "warn", title: "存在同布局角色", detail: "请按桌上约定或随机方式决定同布局内的处理顺序。" }]);

  const inactive = buildSmartHints(input({ phase: "高潮", characters: [a, { ...c, active: false }], battleOrder: [a], selected: a }));
  assert.ok(!titles(inactive).includes("布局尚未齐全"), "脱落角色不要求布局");
});

test("an unfinished resolution blocks advancing and names the actor", () => {
  const resolution = { stage: "回避判定", ninpoName: "接近战攻击" };
  const named = buildSmartHints(input({ phase: "主要", characters: [character({ acted: true })], resolution, resolutionActorName: "雾隐" }));
  assert.deepEqual(named.find((hint) => hint.title.startsWith("结算停在")), {
    tone: "danger",
    title: "结算停在「回避判定」",
    detail: "雾隐 的【接近战攻击】尚未完成，不应直接跳到下一位。",
  });
  const anonymous = buildSmartHints(input({ resolution }));
  assert.equal(anonymous[1].detail, "行动者 的【接近战攻击】尚未完成，不应直接跳到下一位。");
  const finished = buildSmartHints(input({ resolution: { ...resolution, stage: "完成" } }));
  assert.ok(!titles(finished).some((title) => title.startsWith("结算停在")));
});

test("selected character warnings: no usable skill, paralysis, legacy paralysis, spent cost, mission", () => {
  const noSkills = buildSmartHints(input({ availableSkillCount: 0 }));
  assert.deepEqual(noSkills[1], { tone: "danger", title: "月影 没有可用特技", detail: "失去生命力的分野或被麻痹封锁的特技不能用于代用；只有大成功才可能成功。" });

  const paralyzed = character({ conditions: ["麻痹"], paralyzedSkills: ["刀术", "走法"] });
  const layered = buildSmartHints(input({ selected: paralyzed, characters: [paralyzed] }));
  assert.deepEqual(layered[1], { tone: "warn", title: "月影 麻痹×2", detail: "被封特技：《刀术》《走法》；每巡结束可用《身体操术》判定，成功则全部解除。" });
  assert.ok(!titles(layered).includes("旧存档未记录被封特技，请补抽"));

  const legacy = character({ conditions: ["麻痹"], paralyzedSkills: undefined });
  const legacyHints = buildSmartHints(input({ selected: legacy, characters: [legacy] }));
  assert.deepEqual(legacyHints[1], {
    tone: "warn",
    title: "旧存档未记录被封特技，请补抽",
    detail: "月影 带有「麻痹」标签，但没有记录封锁了哪个特技；在变调栏点「麻痹」补抽一层，或点「全部解除」。",
  });

  const spent = character({ plot: 3, spentCost: 3 });
  assert.deepEqual(buildSmartHints(input({ selected: spent, characters: [spent] }))[1], { tone: "warn", title: "本回合花费已用尽", detail: "月影 已使用 3/3。" });
  const underBudget = character({ plot: 3, spentCost: 2 });
  assert.ok(!titles(buildSmartHints(input({ selected: underBudget }))).includes("本回合花费已用尽"));

  const blankMission = character({ mission: "   " });
  assert.deepEqual(buildSmartHints(input({ selected: blankMission }))[1], { tone: "warn", title: "使命尚未填写", detail: "角色卡导入或场景推进前补齐，便于结局检查。" });
});

test("due GM cues are listed, but hidden in table-safe mode", () => {
  const dueCues = [{ id: "a", title: "公开档案", cycle: 1, scene: 1, done: false }, { id: "b", title: "车顶决战", cycle: 1, scene: 1, done: false }];
  assert.deepEqual(buildSmartHints(input({ dueCues }))[1], { tone: "danger", title: "2 个主持事件已到点", detail: "公开档案、车顶决战" });
  assert.deepEqual(buildSmartHints(input({ dueCues, tableSafe: true }))[1], { tone: "danger", title: "2 个主持事件已到点", detail: "请切回 GM 视图查看事件内容。" });
});

test("a calm state outside the intro phase yields the all-clear hint and keeps hint order stable", () => {
  assert.deepEqual(buildSmartHints(input({ phase: "高潮", characters: [character({ plot: 2 })], battleOrder: [character({ plot: 2 })] })), [
    { tone: "good", title: "当前状态无明显冲突", detail: "可以继续推进场景或判定。" },
  ]);
  const everything = buildSmartHints(input({
    phase: "主要",
    sceneAction: "未定",
    resolution: { stage: "命中判定", ninpoName: "手里剑" },
    availableSkillCount: 0,
    selected: character({ mission: "", plot: 1, spentCost: 1, conditions: ["麻痹"], paralyzedSkills: ["刀术"] }),
    dueCues: [{ id: "a", title: "事件", cycle: 1, scene: 1, done: false }],
  }));
  assert.deepEqual(titles(everything), [
    "1 位尚未行动",
    "尚未选择主要行动",
    "结算停在「命中判定」",
    "月影 没有可用特技",
    "月影 麻痹×1",
    "本回合花费已用尽",
    "1 个主持事件已到点",
    "使命尚未填写",
  ]);
});
