// 骰娘指令解析与执行。独立模块：不 import 项目内其他文件（tests/dice.test.mjs 独立转译）。
// 只实现骰点算式与机制级快捷表；FT／WT 不含官方表正文，仅报出目并提示对照规则书。

export type DiceRng = () => number;

export type DiceOutcome = {
  kind: "dice" | "d66" | "sg" | "et" | "table" | "jrrp" | "rtt" | "rct" | "draw" | "help" | "multi";
  text: string;
  flavor?: string;
  tone: "roll" | "danger";
  hidden?: boolean;
};

// 组件按需注入的外部数据；dice.ts 保持零内部 import（独立转译约束）
export type DiceContext = {
  name?: string;
  date?: string;
  skillTable?: Record<string, string[]>;
  decks?: Record<string, string[]>;
};

// 感情表六组（改订版名称，索引 0~5 对应 1D6；与 rules.ts 保持一致，因独立转译约束在本文件重复一份）
const EMOTION_PAIRS: Array<[string, string]> = [
  ["共感", "不信"],
  ["友情", "愤怒"],
  ["爱情", "嫉妒"],
  ["忠诚", "轻蔑"],
  ["憧憬", "自卑"],
  ["狂信", "杀意"],
];

// 骰娘的原创口癖：只在大成功／大失败时探头
const CRIT_LINES = ["12！今晚的骰子站在你这边。", "漂亮，连骰子都想给你鼓掌。", "这一把，值得写进 Replay。"];
const FUMBLE_LINES = ["……骰子刚才滑了一下，对不起。", "别看我，是命运自己拐的弯。", "深呼吸。剧情正因为这一下变得好看了。"];

function rollDie(rng: DiceRng, sides: number) {
  return Math.floor(rng() * sides) + 1;
}

function pickLine(rng: DiceRng, lines: string[]) {
  return lines[Math.floor(rng() * lines.length)] ?? lines[0];
}

// 支持的输入（大小写不限；前缀 . 。 ! ！ / 均认，齐平中文骰娘公约数）：
//   XdY 或 XdY+Z / XdY-Z    例：2d6、3d6+2、1d100（全角＋－也认）；n#表达式 连掷 n 轮（2~6）
//   d66                      两颗 d6 升序读数
//   [n]SG[@s][#f][>=x]       BCDice 风格判定；缺省 2SG@12#2，目标值可省略；n 限 2~10，显式超界拒绝
//   rh 表达式                暗骰：结果打 hidden 标记（公屏配合桌面安全遮蔽，GM 视图可见）
//   ET / 感情表              掷 1D6 给出感情对
//   FT / 大失败表、WT / 变调表   只报出目，效果对照规则书
//   RTT / 随机特技（nRTT 连抽）、RCT / 随机分野 — 需注入特技表
//   jrrp / 今日人品          按「名字+日期」的当日恒定 1~100
//   draw 牌名 [n#] / 抽 牌名   从注入牌堆抽卡，名称模糊匹配、不放回
//   help / 帮助              指令速查
// 命令后的空白与「【…】」起的尾注会被忽略——互通桥调色板整行粘贴可直接掷。
export function rollDiceCommand(input: string, rng: DiceRng = Math.random, context: DiceContext = {}): DiceOutcome | null {
  let working = input.trim().replace(/^[.。/!！]\s*[：:]?\s*/, "");
  // 暗骰前缀：rh / 暗骰，剥掉后按普通指令解析，结果打 hidden 标记
  let hidden = false;
  const hiddenMatch = working.match(/^(?:[rR][hH]|暗骰)(?=$|[\s：:\d])\s*[：:]?\s*/);
  if (hiddenMatch) {
    hidden = true;
    working = working.slice(hiddenMatch[0].length);
    if (!working.trim()) working = "2d6";
  }
  // r 前缀只在后跟空白、冒号或数字时剥离，避免把 ret 之类误剥成 et
  working = working.replace(/^[rR](?=[\s：:\d])\s*[：:]?\s*/, "");
  // n#表达式：连掷 n 轮（draw 的张数语义在 draw 分支单独处理）
  const multi = working.match(/^([2-6])#(.+)$/);
  if (multi && !/^(draw|抽)/i.test(multi[2].trim())) {
    const rounds = Number(multi[1]);
    const parts: string[] = [];
    for (let index = 0; index < rounds; index += 1) {
      const one = rollDiceCommand(multi[2], rng, context);
      if (!one) return null;
      parts.push(`#${index + 1} ${one.text}`);
    }
    return { kind: "multi", tone: "roll", hidden, text: `连掷 ${rounds} 轮：${parts.join("　")}` };
  }
  const contextual = resolveContextCommand(working, rng, context);
  if (contextual) return hidden ? { ...contextual, hidden } : contextual;
  // 命令止于首个空白或「【」；其后视为注释（与 BCDice 容忍尾注的行为一致）
  const commandToken = working.split(/[【\s]/, 1)[0] ?? "";
  const cleaned = commandToken
    .replace(/＋/g, "+")
    .replace(/－/g, "-")
    .toLowerCase();
  if (!cleaned) return null;

  if (cleaned === "et" || cleaned === "感情表") {
    const value = rollDie(rng, 6);
    const pair = EMOTION_PAIRS[value - 1];
    return { kind: "et", tone: "roll", hidden, text: `感情表：1D6=${value} → ${pair[0]}／${pair[1]}（双方各掷一次，正负自选）。` };
  }

  if (cleaned === "ft" || cleaned === "大失败表") {
    return { kind: "table", tone: "roll", hidden, text: `大失败表出目：1D6=${rollDie(rng, 6)}——效果请对照规则书的大失败表。` };
  }
  if (cleaned === "wt" || cleaned === "变调表") {
    return { kind: "table", tone: "roll", hidden, text: `变调表出目：1D6=${rollDie(rng, 6)}——效果请对照规则书的变调表。` };
  }

  if (cleaned === "d66") {
    const first = rollDie(rng, 6);
    const second = rollDie(rng, 6);
    const value = Math.min(first, second) * 10 + Math.max(first, second);
    return { kind: "d66", tone: "roll", hidden, text: `D66：[${first},${second}] 升序读作 ${value}。` };
  }

  const sg = cleaned.match(/^(\d*)sg(?:@(\d+))?(?:#(\d+))?(?:>=?(\d+))?$/);
  if (sg) {
    const count = Number(sg[1] || 2);
    const special = Number(sg[2] || 12);
    const fumble = Number(sg[3] || 2);
    const target = sg[4] ? Number(sg[4]) : null;
    // 显式超界不做无声改写，直接拒绝；special/fumble 相互矛盾同理
    if (count < 2 || count > 10 || special < 3 || special > 12 || fumble < 2 || fumble >= special) return null;
    const dice = Array.from({ length: count }, () => rollDie(rng, 6));
    const kept = [...dice].sort((a, b) => b - a).slice(0, 2);
    const raw = kept[0] + kept[1];
    let result: string;
    let tone: DiceOutcome["tone"] = "roll";
    let flavor: string | undefined;
    if (raw <= fumble) {
      result = "大失败";
      tone = "danger";
      flavor = pickLine(rng, FUMBLE_LINES);
    } else if (raw >= special) {
      result = "大成功";
      flavor = pickLine(rng, CRIT_LINES);
    } else if (target != null) {
      result = raw >= target ? "成功" : "失败";
      if (result === "失败") tone = "danger";
    } else {
      result = `出目 ${raw}`;
    }
    const poolText = count > 2 ? `[${dice.join(",")}] 取高 ${kept.join("+")}` : kept.join("+");
    const command = `${count > 2 ? count : ""}SG@${special}#${fumble}${target != null ? `>=${target}` : ""}`;
    return { kind: "sg", tone, flavor, hidden, text: `[${command}] ${poolText}＝${raw}，${result}。` };
  }

  const plain = cleaned.match(/^(\d{1,2})d(\d{1,4})([+-]\d{1,4})?$/);
  if (plain) {
    const count = Number(plain[1]);
    const sides = Number(plain[2]);
    const modifier = plain[3] ? Number(plain[3]) : 0;
    if (count < 1 || count > 20 || sides < 2 || sides > 1000) return null;
    const dice = Array.from({ length: count }, () => rollDie(rng, sides));
    const sum = dice.reduce((total, value) => total + value, 0) + modifier;
    const modifierText = modifier ? ` ${modifier > 0 ? "+" : "-"}${Math.abs(modifier)}` : "";
    return { kind: "dice", tone: "roll", hidden, text: `${count}D${sides}${modifierText.replace(" ", "")}：[${dice.join(",")}]${modifierText}＝${sum}。` };
  }

  return null;
}

const HELP_TEXT = [
  "骰娘指令速查：",
  "掷骰 2d6+3／1d100／d66（升序）／3#2d6 连掷",
  "判定 [n]SG[@特技线][#变调线][>=目标]，如 3SG>=5",
  "暗骰 rh 2d6（结果配合桌面安全仅 GM 查看）",
  "快捷表 ET 感情表／FT 大失败表／WT 变调表（后两者只报出目）",
  "随机 RTT 随机特技（nRTT 连抽）／RCT 随机分野／jrrp 今日人品",
  "牌堆 draw 地点｜动静｜线索｜代价（draw 牌名 3# 连抽）",
].join("\n");

// 今日人品：hash(名字+日期) 均匀映射 1~100，当日恒定、跨日刷新
export function dailyLuck(name: string, date: string) {
  let hash = 2166136261;
  const seedText = `${name}|${date}`;
  for (let index = 0; index < seedText.length; index += 1) {
    hash ^= seedText.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 100) + 1;
}

const LUCK_LINES: Array<[number, string]> = [
  [96, "大吉。今晚适合把奥义名喊出声。"],
  [80, "吉。骰子今天愿意听你说话。"],
  [60, "中吉。稳扎稳打，代用也能过。"],
  [40, "小吉。别贪高布局。"],
  [20, "末吉。带满兵粮丸再出门。"],
  [1, "……凶。今天让队友先掷。"],
];

function resolveContextCommand(working: string, rng: DiceRng, context: DiceContext): DiceOutcome | null {
  const token = working.split(/[【\s]/, 1)[0]?.toLowerCase() ?? "";

  if (token === "help" || token === "帮助") {
    return { kind: "help", tone: "roll", text: HELP_TEXT };
  }

  if (token === "jrrp" || token === "今日人品") {
    const name = context.name?.trim() || "无名忍者";
    const date = context.date ?? "1970-01-01";
    const luck = dailyLuck(name, date);
    const line = LUCK_LINES.find(([threshold]) => luck >= threshold)?.[1] ?? "";
    return { kind: "jrrp", tone: "roll", text: `${name} 的今日人品：${luck}／100。${line}` };
  }

  const rttMatch = token.match(/^([2-6])?(rtt|随机特技)$/);
  if (rttMatch) {
    const table = context.skillTable;
    if (!table) return { kind: "rtt", tone: "roll", text: "随机特技表需要在控制台内使用（未注入特技表）。" };
    const fields = Object.keys(table);
    const rounds = rttMatch[1] ? Number(rttMatch[1]) : 1;
    const results: string[] = [];
    for (let index = 0; index < rounds; index += 1) {
      const fieldRoll = rollDie(rng, fields.length);
      const field = fields[fieldRoll - 1];
      const skills = table[field] ?? [];
      const skillRoll = rollDie(rng, Math.max(1, skills.length));
      results.push(`1D6=${fieldRoll}【${field}】→ ${skillRoll}【${skills[skillRoll - 1] ?? "?"}】`);
    }
    return { kind: "rtt", tone: "roll", text: `随机特技表${rounds > 1 ? `（连抽 ${rounds}）` : ""}：${results.join("；")}` };
  }

  if (token === "rct" || token === "随机分野") {
    const table = context.skillTable;
    if (!table) return { kind: "rct", tone: "roll", text: "随机分野表需要在控制台内使用（未注入特技表）。" };
    const fields = Object.keys(table);
    const roll = rollDie(rng, fields.length);
    return { kind: "rct", tone: "roll", text: `随机分野表：1D6=${roll} →【${fields[roll - 1]}】` };
  }

  const drawMatch = working.match(/^(?:draw|抽)\s*[：:]?\s*(\S+?)\s*(?:([2-5])#)?$/i);
  if (drawMatch) {
    const decks = context.decks ?? {};
    const names = Object.keys(decks);
    if (!names.length) return { kind: "draw", tone: "roll", text: "牌堆是空的（未注入牌堆）。" };
    const query = drawMatch[1];
    const deckName = names.find((name) => name === query) ?? names.find((name) => name.includes(query) || query.includes(name));
    if (!deckName) return { kind: "draw", tone: "roll", text: `没有叫「${query}」的牌堆。现有：${names.join("、")}。` };
    const pool = [...(decks[deckName] ?? [])];
    if (!pool.length) return { kind: "draw", tone: "roll", text: `牌堆【${deckName}】已经空了。` };
    const count = Math.min(drawMatch[2] ? Number(drawMatch[2]) : 1, pool.length);
    const drawn: string[] = [];
    for (let index = 0; index < count; index += 1) {
      const at = Math.floor(rng() * pool.length);
      drawn.push(pool.splice(at, 1)[0]);
    }
    return { kind: "draw", tone: "roll", text: `牌堆【${deckName}】抽出 ${count} 张：${drawn.join("／")}` };
  }

  return null;
}

export const DICE_MAIDEN_HINT = "骰娘听得懂：2d6+3 · d66 · 3SG>=5 · rh 暗骰 · ET · RTT · jrrp · draw 地点 · help";
