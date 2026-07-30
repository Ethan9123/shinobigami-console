import type { Character, LogEntry, SceneAction } from "./session";

export const SCENE_CARD_KINDS = ["地点", "动静", "线索", "代价"] as const;
export type SceneCardKind = (typeof SCENE_CARD_KINDS)[number];

export type SceneCard = {
  id: string;
  kind: SceneCardKind;
  title: string;
  body: string;
  prompt: string;
};

export type SceneDeckInput = {
  title: string;
  cycle: number;
  sceneNumber: number;
  action: SceneAction;
  tension: number;
  spotlightName: string;
};

export type SceneOracleLikelihood = "不太可能" | "五五开" | "很可能";
export type SceneOracleTone = "favorable" | "mixed" | "danger";

export type SceneOracleResult = {
  dice: [number, number];
  score: number;
  label: string;
  answer: string;
  prompt: string;
  twist: string | null;
  tone: SceneOracleTone;
};

export type SpotlightLedgerEntry = {
  id: string;
  name: string;
  scenes: number;
  share: number;
};

const CARD_LIBRARY: Record<SceneCardKind, Array<Omit<SceneCard, "id" | "kind">>> = {
  地点: [
    { title: "监控死角", body: "城市的视线在这里短暂断开，但有人显然比你们更早知道这一点。", prompt: "请场景玩家描述一件证明此处并不安全的小东西。" },
    { title: "封锁线内", body: "出口还在，却只容得下一种身份、一个承诺或一名角色通过。", prompt: "谁有资格离开？谁正在决定这个资格？" },
    { title: "雨后的天台", body: "潮湿地面留下了过多脚印，远处的灯光把每个动作都拉得很长。", prompt: "哪个痕迹属于本不该到场的人？" },
    { title: "停运的站台", body: "广播仍在重复过期的信息，空车厢却像在等待某位乘客。", prompt: "哪一句广播只对一名角色有意义？" },
    { title: "借来的房间", body: "这里的一切都能使用，但没有一样真正属于在场的人。", prompt: "房主留下了什么不能被移动的东西？" },
    { title: "喧闹的边缘", body: "人群足以遮住忍者，却也让任何干净的退路都变得困难。", prompt: "哪个普通人正在无意间逼近真相？" },
  ],
  动静: [
    { title: "迟到的回声", body: "刚才说过的话从另一个方向传回来，内容被微妙地改动了。", prompt: "是谁听见了不该听见的部分？" },
    { title: "不该响的通知", body: "一台已经关机的设备亮起，显示出只有在场者才知道的称呼。", prompt: "谁会第一时间假装没有看见？" },
    { title: "熟人的脚步", body: "脚步节奏属于一个熟悉的人，但停下的位置完全不对。", prompt: "场景玩家希望来者是谁，又害怕是谁？" },
    { title: "交换失衡", body: "有人先给出了一点真话，逼迫另一方决定要不要付出同等重量。", prompt: "哪句真话会改变这一幕的谈判方式？" },
    { title: "远处先动", body: "局势尚未爆发，远处却已有东西被移走、熄灭或封锁。", prompt: "这是谁的准备动作？" },
    { title: "安静得太快", body: "背景噪音突然消失，像有人为了听清一句话按下了暂停。", prompt: "此刻谁最不愿继续说下去？" },
  ],
  线索: [
    { title: "过于整齐", body: "证据并非缺失，而是被整理得像特意留给调查者观看。", prompt: "哪个细节暴露了整理者的习惯？" },
    { title: "同一枚痕迹", body: "两个互不相干的人或地点留下了同一种微小痕迹。", prompt: "先追共同来源，还是先质问其中一方？" },
    { title: "时间差", body: "记录本身没有说谎，但它证明某个人不可能同时出现在两处。", prompt: "这洗清了谁，又让谁更可疑？" },
    { title: "关系的缺口", body: "公开说法里少了一段关系；沉默比任何名字都更醒目。", prompt: "谁会因补上这个名字而受到伤害？" },
    { title: "被使用的误会", body: "一个错误判断被人故意保留下来，并且已经带来了好处。", prompt: "揭穿它会让谁失去优势？" },
    { title: "来自下一幕", body: "眼前线索指向尚未发生的会面、袭击或背叛。", prompt: "角色要提前阻止，还是将计就计？" },
  ],
  代价: [
    { title: "被看见", body: "目标仍可达成，但行动会让某个阵营确认角色已经介入。", prompt: "让谁看见，才能制造最有意思的后果？" },
    { title: "欠下一句承诺", body: "帮助就在眼前，对方只要求一个暂时不用兑现的答复。", prompt: "角色愿意承诺到什么程度？" },
    { title: "时钟前进", body: "没有人立刻受伤，但更大的事件因此提前一步到来。", prompt: "用哪个可见变化证明时间已经减少？" },
    { title: "必须选边", body: "保持中立仍然可能，只是会同时失去两边的一部分信任。", prompt: "角色公开支持谁，私下又想保护谁？" },
    { title: "留下证物", body: "角色可以全身而退，也可以带走目标；两者无法同时做到。", prompt: "留下什么最能代表这次选择？" },
    { title: "关系介入", body: "一名未登场角色将从结果中受益或受损，并很快知道原因。", prompt: "谁会误解场景玩家的动机？" },
  ],
};

const ORACLE_TWISTS = [
  "第三方比预想更早介入；先问他想从局势中得到什么。",
  "答案本身成立，但时间、地点或对象有一项被理解错了。",
  "一段旧关系突然变得重要；让最久没有被提到的人进入画面。",
  "局势出现镜像：对手正在做与角色相同的选择。",
  "代价不会立刻出现；先留下一个所有人都能看见的预兆。",
  "一件不起眼的普通物品成为决定局势的钥匙。",
];

function hash(text: string) {
  let value = 2166136261;
  for (const character of text) {
    value ^= character.codePointAt(0) ?? 0;
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function cardAt(kind: SceneCardKind, seed: string, nonce: number): SceneCard {
  const library = CARD_LIBRARY[kind];
  const index = (hash(`${seed}:${kind}`) + Math.max(0, nonce)) % library.length;
  return { ...library[index], id: `${kind}-${index}-${nonce}`, kind };
}

export function generateSceneDeck(input: SceneDeckInput, nonce = 0): SceneCard[] {
  const seed = [
    input.title.trim() || "未命名忍务",
    input.cycle,
    input.sceneNumber,
    input.action,
    input.tension,
    input.spotlightName,
  ].join(":");
  return SCENE_CARD_KINDS.map((kind) => cardAt(kind, seed, nonce));
}

export function askSceneOracle(input: {
  question: string;
  likelihood: SceneOracleLikelihood;
  tension: number;
  seed: string;
}): SceneOracleResult {
  const basis = `${input.seed}:${input.question.trim() || "局势会如何变化"}`;
  const dice: [number, number] = [
    (hash(`${basis}:first`) % 6) + 1,
    (hash(`${basis}:second`) % 6) + 1,
  ];
  const likelihoodModifier = input.likelihood === "很可能" ? 1 : input.likelihood === "不太可能" ? -1 : 0;
  const score = Math.max(2, Math.min(12, dice[0] + dice[1] + likelihoodModifier));
  const twist = dice[0] === dice[1] || (input.tension >= 80 && score <= 5)
    ? ORACLE_TWISTS[hash(`${basis}:twist`) % ORACLE_TWISTS.length]
    : null;

  if (score >= 10) {
    return {
      dice,
      score,
      label: "局势明显有利",
      answer: "预期方向成立，而且角色能先看见它带来的机会。",
      prompt: "请玩家说出：抓住机会后，他想把主动权交给谁？",
      twist,
      tone: "favorable",
    };
  }
  if (score >= 7) {
    return {
      dice,
      score,
      label: "有利，但附带条件",
      answer: "方向基本成立，不过必须接受一个可见、可选择的条件。",
      prompt: "把条件说清楚，再问玩家是否仍愿意继续。",
      twist,
      tone: "mixed",
    };
  }
  if (score >= 5) {
    return {
      dice,
      score,
      label: "暂时不利，却出现入口",
      answer: "直接路径被挡住，但局势暴露了另一个可行动的切口。",
      prompt: "给出入口，不替玩家决定要不要付出代价。",
      twist,
      tone: "mixed",
    };
  }
  return {
    dice,
    score,
    label: "局势明确不利",
    answer: "预期方向不成立，对手或环境获得了清楚可见的优势。",
    prompt: "不要封死故事；让玩家在撤退、暴露或交换中选择一种后果。",
    twist,
    tone: "danger",
  };
}

export function calculateSpotlightLedger(characters: Character[], logs: LogEntry[]): SpotlightLedgerEntry[] {
  const pcs = characters.filter((character) => character.role === "PC");
  const counts = pcs.map((character) => ({
    id: character.id,
    name: character.name,
    scenes: logs.filter((entry) => entry.tone === "action" && entry.text.includes(`场完成：${character.name} 进行了`)).length,
  }));
  const total = counts.reduce((sum, entry) => sum + entry.scenes, 0);
  return counts.map((entry) => ({
    ...entry,
    share: total ? Math.round((entry.scenes / total) * 100) : 0,
  }));
}

// 供骰娘 .draw 使用：把场景牌库暴露为「牌堆名 → 条目」映射（标题＋正文拼合）
export function listSceneCardDecks(): Record<string, string[]> {
  return Object.fromEntries(
    SCENE_CARD_KINDS.map((kind) => [kind, CARD_LIBRARY[kind].map((card) => `《${card.title}》${card.body}`)]),
  );
}
