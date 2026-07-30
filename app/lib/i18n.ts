// 界面语言层（chrome 级三语）。独立模块：不 import 项目内其他文件（tests/i18n.test.mjs 独立转译）。
// 范围：导航、视图名、语言切换与新手引导入口。深层面板文案的翻译按版本逐步扩展。

export type Locale = "zh" | "en" | "ja";

export const LOCALES: Array<{ id: Locale; label: string }> = [
  { id: "zh", label: "中文" },
  { id: "en", label: "EN" },
  { id: "ja", label: "日本語" },
];

export const LOCALE_STORAGE_KEY = "shinobigami-console-locale";

type Pack = Record<string, { zh: string; en: string; ja: string }>;

const UI: Pack = {
  "nav.academy": { zh: "新手学院", en: "Academy", ja: "初心者学院" },
  "nav.tutorial": { zh: "第一次忍务", en: "First Mission", ja: "はじめてのミッション" },
  "nav.prep": { zh: "开团准备", en: "Session Prep", ja: "セッション準備" },
  "nav.replay": { zh: "Replay 工房", en: "Replay Forge", ja: "リプレイ工房" },
  "nav.battle": { zh: "战斗控制台", en: "Battle Console", ja: "戦闘コンソール" },
  "nav.director": { zh: "场景导演", en: "Scene Director", ja: "シーン監督" },
  "nav.sheet": { zh: "角色工作台", en: "Character Bench", ja: "キャラクター工房" },
  "phase.intro": { zh: "导入", en: "Intro", ja: "導入" },
  "phase.main": { zh: "主要", en: "Main", ja: "メイン" },
  "phase.climax": { zh: "高潮", en: "Climax", ja: "クライマックス" },
  "chrome.gmView": { zh: "GM 视图", en: "GM View", ja: "GMビュー" },
  "chrome.tableSafe": { zh: "桌面安全", en: "Table Safe", ja: "卓上セーフ" },
  "chrome.export": { zh: "导出存档", en: "Export Save", ja: "セーブ出力" },
  "chrome.import": { zh: "导入", en: "Import", ja: "読み込み" },
  "chrome.undo": { zh: "↶ 撤销", en: "↶ Undo", ja: "↶ 取り消し" },
  "chrome.newRound": { zh: "新回合", en: "New Round", ja: "新ラウンド" },
  "chrome.nextActor": { zh: "下一位 →", en: "Next →", ja: "次へ →" },
  "chrome.language": { zh: "界面语言", en: "Language", ja: "言語" },
  "academy.kicker": { zh: "FROM ZERO", en: "FROM ZERO", ja: "ゼロから" },
  "academy.title": { zh: "新手学院：从零学会忍神", en: "Academy: Shinobigami from Zero", ja: "初心者学院：ゼロから学ぶシノビガミ" },
  "academy.subtitle": {
    zh: "九节课，从「什么是 TRPG」到「自己当 GM」。每节课都可以跳到控制台里立刻试一次。",
    en: "Nine lessons, from \"what is a TTRPG\" to \"running your own game\". Every lesson links to a live console feature you can try immediately.",
    ja: "「TRPGとは」から「自分でGMをやる」まで全9課。各課からコンソールの機能へ飛んで、その場で試せます。",
  },
  "academy.progress": { zh: "学习进度", en: "Progress", ja: "進捗" },
  "academy.done": { zh: "已完成", en: "Done", ja: "完了" },
  "academy.markDone": { zh: "标记完成", en: "Mark done", ja: "完了にする" },
  "academy.markUndone": { zh: "取消标记", en: "Unmark", ja: "取り消す" },
  "academy.glossary": { zh: "三语术语对照表", en: "Trilingual Glossary", ja: "三言語用語対照表" },
  "academy.glossaryNote": {
    zh: "对照中文规则书、英文版（Kotodama 译）与日文原版时使用。仅收术语名称，不含规则正文。",
    en: "For cross-reading the Chinese rulebook, the English edition (Kotodama translation) and the Japanese original. Term names only — no rules text.",
    ja: "中国語版・英語版（Kotodama訳）・日本語原版を読み比べる際に。用語名のみ、ルール本文は含みません。",
  },
  "welcome.title": { zh: "第一次来？选一条路", en: "First time here? Pick a path", ja: "初めてですか？道を選ぼう" },
  "welcome.pathAcademy": {
    zh: "完全没接触过忍神 → 新手学院（九节课，看完就懂规则在玩什么）",
    en: "Never played Shinobigami → Academy (nine lessons; you'll understand what the rules are doing)",
    ja: "シノビガミが初めて → 初心者学院（全9課、ルールの狙いがわかる）",
  },
  "welcome.pathTutorial": {
    zh: "想边玩边学 → 第一次忍务（单人教学剧本《雨夜零号线》）",
    en: "Learn by playing → First Mission (solo teaching scenario \"Rain on Line Zero\")",
    ja: "遊びながら学ぶ → はじめてのミッション（ソロ教習シナリオ『雨夜のゼロ号線』）",
  },
  "welcome.pathPro": {
    zh: "已经会玩 → 直接去「开团准备」拉起一团",
    en: "Already know the game → jump to Session Prep and start a game",
    ja: "経験者 → そのまま「セッション準備」へ",
  },
};

export function t(key: string, locale: Locale): string {
  const entry = UI[key];
  if (!entry) return key;
  return entry[locale] ?? entry.zh;
}

export function normalizeLocale(value: unknown): Locale {
  return value === "en" || value === "ja" ? value : "zh";
}
