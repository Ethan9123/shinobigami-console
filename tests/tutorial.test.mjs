import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/lib/tutorial.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const tutorial = await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);

test("v0.4 state without tutorial normalizes to a safe idle tutorial", () => {
  const idle = tutorial.normalizeTutorialState({
    schemaVersion: 4,
    characters: [{ id: "legacy-pc" }],
    phase: "主要",
  });

  assert.equal(idle.schemaVersion, 1);
  assert.equal(idle.status, "off");
  assert.equal(idle.scenarioId, null);
  assert.equal(idle.stepId, null);
  assert.deepEqual(idle.completedStepIds, []);
  assert.equal(idle.safety.confirmed, false);
  assert.equal(idle.heroLife, 4);
  assert.equal(idle.enemyLife, 4);

  const running = tutorial.createRainZeroLineTutorialState();
  const nested = tutorial.normalizeTutorialState({ tutorial: running });
  assert.equal(nested.status, "running");
  assert.equal(nested.stepId, "welcome");
});

test("rain zero line has stable, internally valid scenario references", () => {
  const scenario = tutorial.RAIN_ZERO_LINE;
  assert.equal(scenario.id, "rain-zero-line");
  assert.equal(scenario.meta.title, "雨夜零号线");
  assert.equal(scenario.prize.name, "白狐匣");
  assert.equal(scenario.meta.cycles, 2);
  assert.ok(scenario.steps.length >= 12 && scenario.steps.length <= 16);

  const stepIds = scenario.steps.map((step) => step.id);
  assert.equal(new Set(stepIds).size, stepIds.length);
  for (const step of scenario.steps) {
    if (step.next != null) assert.ok(stepIds.includes(step.next), `${step.id} points to missing step ${step.next}`);
  }
  assert.equal(scenario.steps.at(-1).next, null);

  const characterIds = scenario.characters.map((preset) => preset.character.id);
  assert.equal(new Set(characterIds).size, 3);
  assert.equal(scenario.characters.filter((preset) => preset.character.role === "NPC").length, 2);
  assert.equal(scenario.characters.filter((preset) => preset.character.role === "PC").length, 1);
  assert.ok(characterIds.includes(scenario.setup.heroId));
  assert.ok(characterIds.includes(scenario.setup.allyId));
  assert.ok(characterIds.includes(scenario.setup.enemyId));
  assert.ok(scenario.npcIds.every((id) => characterIds.includes(id)));

  const hero = scenario.characters.find((preset) => preset.role === "hero").character;
  assert.ok(scenario.attacks.every((attack) => hero.ninpoIds.includes(attack.id)));
  assert.equal(new Set(scenario.endings.map((ending) => ending.id)).size, scenario.endings.length);
  assert.deepEqual(new Set(scenario.endings.map((ending) => ending.choice)), new Set(["seal", "break", "carry"]));
});

test("tutorial gates advance only after their required action", () => {
  let state = tutorial.createRainZeroLineTutorialState();
  assert.equal(tutorial.getTutorialStep(state).id, "welcome");
  state = tutorial.advanceTutorial(state);
  assert.equal(state.stepId, "safety");

  const blocked = tutorial.advanceTutorial(state);
  assert.equal(blocked, state);
  state = tutorial.recordTutorialChoice(state, "safety-confirmed", "yes");
  assert.equal(state.safety.confirmed, true);
  assert.equal(state.stepId, "mission");
  assert.ok(state.completedStepIds.includes("safety"));
});

test("failed checks record their cost and still move the story forward", () => {
  const start = {
    ...tutorial.createRainZeroLineTutorialState(),
    stepId: "cycle-1-check",
  };
  const state = tutorial.rollTutorialCheck(start, "trace-carriage", [1, 1], 7, "conductor-alerted");

  assert.equal(state.outcomes["trace-carriage"], "fumble");
  assert.equal(state.lastRoll.total, 2);
  assert.ok(state.flags.includes("conductor-alerted"));
  assert.ok(state.completedStepIds.includes("cycle-1-check"));
  assert.equal(state.stepId, "cycle-1-result");
});

test("combat dice injection is reproducible and rejects illegal actions", () => {
  const start = {
    ...tutorial.createRainZeroLineTutorialState(),
    stepId: "climax-battle",
  };
  const input = { plot: 3, attackId: "close", dice: [6, 6], enemyDice: [1, 1] };
  const first = tutorial.resolveTutorialCombatRound(start, input);
  const second = tutorial.resolveTutorialCombatRound(start, input);

  assert.equal(first.valid, true);
  assert.deepEqual(first, second);
  assert.equal(first.state.combatRound, 1);
  assert.equal(first.state.enemyLife, 2);
  assert.equal(first.state.heroLife, 4);
  assert.equal(first.state.outcomes["combat-1-hero"], "critical");
  assert.ok(first.summary.some((line) => line.includes("第 1 回合")));

  const illegal = tutorial.resolveTutorialCombatRound(start, {
    plot: 6,
    attackId: "close",
    dice: [6, 6],
    enemyDice: [1, 1],
  });
  assert.equal(illegal.valid, false);
  assert.equal(illegal.state, start);
  assert.ok(illegal.errors.some((error) => error.includes("超过")));
});

test("combat always leaves the loop after at most three rounds", () => {
  let state = {
    ...tutorial.createRainZeroLineTutorialState(),
    stepId: "climax-battle",
  };
  let result;
  for (const plot of [3, 4, 2]) {
    result = tutorial.resolveTutorialCombatRound(state, {
      plot,
      attackId: "close",
      dice: [1, 2],
      enemyDice: [1, 1],
    });
    assert.equal(result.valid, true);
    state = result.state;
  }

  assert.equal(result.status, "round-limit");
  assert.equal(state.combatRound, 3);
  assert.ok(state.flags.includes("combat-complete"));
  assert.ok(state.flags.includes("combat-round-limit"));
  assert.equal(state.stepId, "ending");

  const fourth = tutorial.resolveTutorialCombatRound(state, {
    plot: 3,
    attackId: "close",
    dice: [6, 6],
    enemyDice: [1, 1],
  });
  assert.equal(fourth.valid, false);
  assert.ok(fourth.errors.some((error) => error.includes("已经结束")));
});

test("ending choice and discovered truth produce distinct conclusions", () => {
  const base = {
    ...tutorial.createRainZeroLineTutorialState(),
    stepId: "ending",
    flags: ["combat-complete"],
  };
  const informedSeal = tutorial.chooseTutorialEnding({
    ...base,
    outcomes: { "trace-carriage": "success" },
  }, "seal");
  const uncertainSeal = tutorial.chooseTutorialEnding({
    ...base,
    outcomes: { "trace-carriage": "failure" },
  }, "seal");
  const broken = tutorial.chooseTutorialEnding(base, "break");
  const carried = tutorial.chooseTutorialEnding(base, "carry");

  assert.equal(informedSeal.endingId, "dawn-platform");
  assert.equal(uncertainSeal.endingId, "quiet-platform");
  assert.equal(broken.endingId, "shattered-dawn");
  assert.equal(carried.endingId, "last-passenger");
  assert.equal(new Set([informedSeal.endingId, uncertainSeal.endingId, broken.endingId, carried.endingId]).size, 4);
  assert.equal(informedSeal.stepId, "debrief");
  assert.ok(informedSeal.completedStepIds.includes("ending"));
});
