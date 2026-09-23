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

const academy = await importTS("../app/lib/academy.ts");
const i18n = await importTS("../app/lib/i18n.ts");

test("academy ships nine fully trilingual lessons", () => {
  assert.equal(academy.ACADEMY_LESSONS.length, 9);
  for (const lesson of academy.ACADEMY_LESSONS) {
    for (const field of [lesson.title, lesson.goal, ...lesson.body, ...(lesson.points ?? [])]) {
      assert.ok(field.zh?.length && field.en?.length && field.ja?.length, `${lesson.id} 缺少语言字段`);
    }
    assert.ok(lesson.minutes >= 3 && lesson.minutes <= 10);
    if (lesson.tryIt) {
      assert.ok(["prep", "battle", "director", "sheet", "replay", "tutorial"].includes(lesson.tryIt.view));
      assert.ok(lesson.tryIt.label.zh && lesson.tryIt.label.en && lesson.tryIt.label.ja);
    }
  }
  const ids = academy.ACADEMY_LESSONS.map((lesson) => lesson.id);
  assert.equal(new Set(ids).size, ids.length, "课程 id 不应重复");
});

test("glossary uses confirmed official English terms", () => {
  assert.ok(academy.GLOSSARY.length >= 40);
  const byZh = Object.fromEntries(academy.GLOSSARY.map((entry) => [entry.zh, entry]));
  assert.equal(byZh["忍术"].en, "Stealth");
  assert.equal(byZh["奥义"].en, "Ohgi (Secret Technique)");
  assert.match(byZh["感情"].en, /Emotional Bond/);
  assert.equal(byZh["布局"].ja, "プロット（値）");
  assert.equal(byZh["变调"].en, "Status Ailment");
  assert.equal(byZh["秘宝"].en, "Prize");
  assert.equal(byZh["秘宝"].ja, "プライズ");
  assert.equal(byZh["巡"].en, "Cycle");
  assert.equal(byZh["剧情场景"].en, "Drama Scene");
  assert.equal(byZh["剧情场景"].ja, "ドラマシーン");
  // 官方英文速查表感情表第 1 行：Empathy (+) / Mistrust (-)
  const empathy = academy.GLOSSARY.find((entry) => entry.zh.startsWith("共鸣"));
  const mistrust = academy.GLOSSARY.find((entry) => entry.zh.startsWith("猜疑"));
  assert.match(empathy.en, /^Empathy/);
  assert.match(mistrust.en, /^Mistrust/);
  for (const entry of academy.GLOSSARY) {
    assert.ok(entry.zh && entry.en && entry.ja, `${entry.zh} 术语三语不全`);
  }
});

test("lesson text drops wording corrected against rulebook v1.51 (zh)", () => {
  const banned = ["主动摊牌", "无条件命中", "每场景一次", "戏剧场景", "战利品"];
  const zhChunks = [];
  for (const lesson of academy.ACADEMY_LESSONS) {
    zhChunks.push(lesson.title.zh, lesson.goal.zh);
    for (const paragraph of lesson.body) zhChunks.push(paragraph.zh);
    for (const point of lesson.points ?? []) zhChunks.push(point.zh);
    if (lesson.tryIt) zhChunks.push(lesson.tryIt.label.zh);
  }
  for (const entry of academy.GLOSSARY) zhChunks.push(entry.zh);
  const allZh = zhChunks.join("\n");
  for (const phrase of banned) {
    assert.ok(!allZh.includes(phrase), `课文/术语表 zh 字段不应再出现「${phrase}」`);
  }
});

test("academy progress normalization filters unknown ids", () => {
  const known = academy.ACADEMY_LESSONS[0].id;
  assert.deepEqual(academy.normalizeAcademyProgress([known, "ghost-lesson", 42, null]), [known]);
  assert.deepEqual(academy.normalizeAcademyProgress([known, known, known]), [known], "重复项应去重");
  assert.deepEqual(academy.normalizeAcademyProgress("not-an-array"), []);
});

test("i18n chrome pack covers all three locales and falls back safely", () => {
  for (const key of ["nav.academy", "nav.prep", "academy.title", "welcome.title", "chrome.tableSafe"]) {
    for (const locale of ["zh", "en", "ja"]) {
      const value = i18n.t(key, locale);
      assert.ok(value && value !== key, `${key}/${locale} 缺失`);
    }
  }
  assert.equal(i18n.t("no.such.key", "en"), "no.such.key");
  assert.equal(i18n.normalizeLocale("ja"), "ja");
  assert.equal(i18n.normalizeLocale("fr"), "zh");
  assert.equal(i18n.LOCALES.length, 3);
});
