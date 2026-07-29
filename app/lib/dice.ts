// 骰娘指令解析与执行。独立模块：不 import 项目内其他文件（tests/dice.test.mjs 独立转译）。
// 只实现骰点算式与机制级快捷表；FT／WT 不含官方表正文，仅报出目并提示对照规则书。

export type DiceRng = () => number;

export type DiceOutcome = {
  kind: "dice" | "d66" | "sg" | "et" | "table";
  text: string;
  flavor?: string;
  tone: "roll" | "danger";
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

// 支持的输入（大小写不限，允许 .r／r 前缀及其后的半角/全角冒号）：
//   XdY 或 XdY+Z / XdY-Z    例：2d6、3d6+2、1d100（全角＋－也认）
//   d66                      两颗 d6 升序读数
//   [n]SG[@s][#f][>=x]       BCDice 风格判定；缺省 2SG@12#2，目标值可省略；n 限 2~10，显式超界拒绝
//   ET / 感情表              掷 1D6 给出感情对
//   FT / 大失败表、WT / 变调表   只报出目，效果对照规则书
// 命令后的空白与「【…】」起的尾注会被忽略——互通桥调色板整行粘贴可直接掷。
export function rollDiceCommand(input: string, rng: DiceRng = Math.random): DiceOutcome | null {
  let working = input.trim().replace(/^[.。/]\s*[：:]?\s*/, "");
  // r 前缀只在后跟空白、冒号或数字时剥离，避免把 ret 之类误剥成 et
  working = working.replace(/^[rR](?=[\s：:\d])\s*[：:]?\s*/, "");
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
    return { kind: "et", tone: "roll", text: `感情表：1D6=${value} → ${pair[0]}／${pair[1]}（双方各掷一次，正负自选）。` };
  }

  if (cleaned === "ft" || cleaned === "大失败表") {
    return { kind: "table", tone: "roll", text: `大失败表出目：1D6=${rollDie(rng, 6)}——效果请对照规则书的大失败表。` };
  }
  if (cleaned === "wt" || cleaned === "变调表") {
    return { kind: "table", tone: "roll", text: `变调表出目：1D6=${rollDie(rng, 6)}——效果请对照规则书的变调表。` };
  }

  if (cleaned === "d66") {
    const first = rollDie(rng, 6);
    const second = rollDie(rng, 6);
    const value = Math.min(first, second) * 10 + Math.max(first, second);
    return { kind: "d66", tone: "roll", text: `D66：[${first},${second}] 升序读作 ${value}。` };
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
    return { kind: "sg", tone, flavor, text: `[${command}] ${poolText}＝${raw}，${result}。` };
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
    return { kind: "dice", tone: "roll", text: `${count}D${sides}${modifierText.replace(" ", "")}：[${dice.join(",")}]${modifierText}＝${sum}。` };
  }

  return null;
}

export const DICE_MAIDEN_HINT = "骰娘听得懂：2d6+3 · d66 · 3SG>=5 · ET · FT · WT";
