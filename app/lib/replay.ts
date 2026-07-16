export type ReplayGenre = "都市悬疑" | "学园怪谈" | "黑色谍战" | "热血决战";
export type ReplayLength = "短篇" | "标准" | "长篇";
export type ReplayEnding = "苦涩胜利" | "破晓逆转" | "开放悬念" | "任务失败";
export type ReplayPhase = "导入" | "主要" | "高潮" | "结局";
export type ReplayBeat = "引子" | "初探" | "受挫" | "假胜利" | "反转" | "至暗时刻" | "反击" | "高潮" | "余韵";

export type ReplayCharacter = {
  id: string;
  name: string;
  role: "PC" | "NPC";
  faction?: string;
  mission?: string;
  secret?: string;
  belief?: string;
  story?: string;
  ougi?: string;
  skills?: string[];
  ninpoNames?: string[];
};

export type ReplayConfig = {
  title: string;
  genre: ReplayGenre;
  length: ReplayLength;
  ending: ReplayEnding;
  intensity: 1 | 2 | 3;
  seed: string;
  protagonistId: string;
  revealSecrets: boolean;
};

export type ReplayLine = {
  id: string;
  speaker: string;
  text: string;
  kind: "narration" | "dialogue" | "roll" | "reveal";
};

export type ReplayScene = {
  id: string;
  index: number;
  phase: ReplayPhase;
  beat: ReplayBeat;
  title: string;
  tension: number;
  lines: ReplayLine[];
};

export type GeneratedReplay = {
  schemaVersion: 1;
  title: string;
  seed: string;
  createdAt: string;
  config: ReplayConfig;
  scenes: ReplayScene[];
  text: string;
  stats: { sceneCount: number; lineCount: number; rollCount: number; successes: number; peakTension: number };
};

type Random = () => number;

const GENRE_DETAILS: Record<ReplayGenre, { openings: string[]; locations: string[]; threats: string[]; clues: string[] }> = {
  都市悬疑: {
    openings: ["雨把霓虹揉碎在最后一班电车的车窗上", "午夜零点，整条商业街同时熄灯", "高架桥下的积水倒映出一轮不存在的月亮"],
    locations: ["封锁的地下月台", "废弃资料馆", "只在雨夜营业的便利店", "停电的观景塔"],
    threats: ["没有脚步声的追踪者", "会篡改监控记录的影子", "比委托早一步抵达的清扫人"],
    clues: ["一张时间晚了七分钟的车票", "被水浸透却仍在发热的照片", "来自失踪者号码的未接来电"],
  },
  学园怪谈: {
    openings: ["放学铃响过第十三次，校门仍没有打开", "旧校舍的广播在无人值班时念出了全员姓名", "文化祭前夜，天台多出了一扇门"],
    locations: ["贴满封条的音乐教室", "倒映不出人影的泳池", "被校史抹去的地下社团室", "永远停在四点四十四分的钟楼"],
    threats: ["穿着旧制服的无脸学生", "从点名簿里爬出的低语", "负责维持日常假象的风纪委员"],
    clues: ["缺少毕业照的一页相册", "只写着明天日期的请假条", "储物柜里尚有余温的红线"],
  },
  黑色谍战: {
    openings: ["交换地点被提前清空，只剩一杯还热的咖啡", "加密频道里传来已经阵亡之人的识别码", "停战协议签署前六小时，证人从安全屋消失"],
    locations: ["双重监听的领事馆", "驶向边境的夜班列车", "没有登记记录的安全屋", "雾中的货运码头"],
    threats: ["同时为三方工作的联络员", "奉命回收所有证人的处刑队", "知道每个人旧代号的叛徒"],
    clues: ["被调换过一次的微缩胶卷", "只有半段的撤离口令", "写在弹壳内侧的坐标"],
  },
  热血决战: {
    openings: ["警报撕开夜空，结界在城市上方裂成六道", "宿敌的挑战书钉在流派大门正中", "祭典烟火升起时，封印巨响着崩开"],
    locations: ["燃烧的跨海大桥", "被雷云包围的古战场", "正在坍塌的祭坛", "逆风疾驰的装甲列车"],
    threats: ["将失败视作荣耀的宿敌", "吸收每次攻击而成长的妖影", "准备以整座城市完成仪式的首领"],
    clues: ["前代忍者留下的断刃", "与心跳同步发光的印记", "藏在挑战书背面的求救讯息"],
  },
};

const BEATS: Array<{ beat: ReplayBeat; phase: ReplayPhase; tension: number }> = [
  { beat: "引子", phase: "导入", tension: 18 },
  { beat: "初探", phase: "主要", tension: 35 },
  { beat: "受挫", phase: "主要", tension: 58 },
  { beat: "假胜利", phase: "主要", tension: 43 },
  { beat: "反转", phase: "主要", tension: 72 },
  { beat: "至暗时刻", phase: "主要", tension: 89 },
  { beat: "反击", phase: "主要", tension: 77 },
  { beat: "高潮", phase: "高潮", tension: 100 },
  { beat: "余韵", phase: "结局", tension: 34 },
];

const LENGTH_INDEXES: Record<ReplayLength, number[]> = {
  短篇: [0, 1, 4, 7, 8],
  标准: [0, 1, 2, 3, 4, 7, 8],
  长篇: [0, 1, 2, 3, 4, 5, 6, 7, 8],
};

const SCENE_TITLES: Record<ReplayBeat, string[]> = {
  引子: ["不该抵达的委托", "雨幕中的召集", "无人承认的密令"],
  初探: ["第一枚破绽", "追迹无声", "被抹去的七分钟"],
  受挫: ["线索在眼前燃尽", "错误的名字", "代价开始说话"],
  假胜利: ["过早打开的门", "一切似乎结束", "掌心里的赝品"],
  反转: ["秘密的第二层", "背叛者并非一人", "使命彼此相噬"],
  至暗时刻: ["无人可以全身而退", "最坏的答案", "同伴拔刀相向"],
  反击: ["把谎言变成诱饵", "最后一次共斗", "逆转的代价"],
  高潮: ["所有秘密在此交锋", "黎明前的最后布局", "赌上名字的一击"],
  余韵: ["天亮以后", "没有写进报告的结局", "余火仍在"],
};

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRandom(seed: string): Random {
  let state = hashSeed(seed) || 0x9e3779b9;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: Random, items: T[]): T {
  return items[Math.floor(random() * items.length)] ?? items[0];
}

function compact(value: string | undefined, fallback: string, limit = 64) {
  const text = value?.replace(/\s+/g, " ").trim() || fallback;
  return text.length > limit ? `${text.slice(0, limit)}……` : text;
}

function beliefLine(character: ReplayCharacter, beat: ReplayBeat, random: Random) {
  const belief = character.belief?.trim();
  const lines: Record<string, string[]> = {
    情: ["人不是完成使命的筹码。", "如果必须有人留下，我会先问他愿不愿意。"],
    忠: ["命令不会替我承担后果，但我仍会完成它。", "我可以怀疑一切，唯独不能放弃职责。"],
    律: ["越是混乱，越需要有人守住界线。", "规则不是借口，是我选择承担的形状。"],
    我: ["别替我决定什么才算胜利。", "这一次，我按自己的答案行动。"],
    和: ["我们走到这里，不是为了独自活着回去。", "先把刀放低；还有一句话没有说完。"],
    凶: ["挡路的东西，斩开就够了。", "恐惧很好，它证明敌人终于认真了。"],
  };
  const fallback = beat === "至暗时刻" ? "如果真相一定要伤人，那就先伤我。" : "我会完成使命，但结局由我选择。";
  return pick(random, lines[belief ?? ""] ?? [fallback]);
}

function roll2d6(random: Random, target: number) {
  const dice: [number, number] = [Math.floor(random() * 6) + 1, Math.floor(random() * 6) + 1];
  const total = dice[0] + dice[1];
  return { dice, total, target, success: total >= target };
}

function fallbackCharacter(id: string, name: string, role: "PC" | "NPC"): ReplayCharacter {
  return { id, name, role, faction: "流派不明", mission: "查明事件真相", secret: "身份与使命并不一致", belief: role === "PC" ? "情" : "凶", skills: ["调查术"], ninpoNames: ["接近战攻击"] };
}

function sceneHeading(scene: ReplayScene, mainIndex: number) {
  if (scene.phase === "导入") return `导入场景：${scene.title}`;
  if (scene.phase === "高潮") return `高潮阶段：${scene.title}`;
  if (scene.phase === "结局") return `场景：${scene.title}`;
  const numerals = ["一", "二", "三", "四", "五", "六", "七"];
  return `第${numerals[mainIndex] ?? mainIndex + 1}巡场景：${scene.title}`;
}

function makeSceneLines(
  beat: ReplayBeat,
  cast: { hero: ReplayCharacter; ally: ReplayCharacter; rival: ReplayCharacter },
  details: (typeof GENRE_DETAILS)[ReplayGenre],
  config: ReplayConfig,
  random: Random,
  counters: { rolls: number; successes: number },
) {
  const { hero, ally, rival } = cast;
  const location = pick(random, details.locations);
  const threat = pick(random, details.threats);
  const clue = pick(random, details.clues);
  const skill = pick(random, hero.skills?.length ? hero.skills : ["调查术"]);
  const ninpo = pick(random, hero.ninpoNames?.length ? hero.ninpoNames : ["接近战攻击"]);
  const objective = compact(hero.mission, "查明事件真相并保护目标");
  const secret = compact(hero.secret, "被隐藏的过去", 80);
  const rivalSecret = compact(rival.secret, "真正的使命另有其人", 80);
  const lines: ReplayLine[] = [];
  const add = (speaker: string, text: string, kind: ReplayLine["kind"] = speaker === "GM" ? "narration" : "dialogue") => lines.push({ id: `line-${beat}-${lines.length + 1}`, speaker, text, kind });
  const addRoll = (target: number, label: string) => {
    const roll = roll2d6(random, target);
    counters.rolls += 1;
    if (roll.success) counters.successes += 1;
    add("SYSTEM", `${label}（${skill}）：2D6>=${target} → [${roll.dice.join(",")}] = ${roll.total}，${roll.success ? "成功" : "失败"}`, "roll");
    return roll.success;
  };

  if (beat === "引子") {
    add("GM", `${pick(random, details.openings)}。在${location}，${hero.name}收到一份没有署名的委托：${objective}。`);
    add(hero.name, beliefLine(hero, beat, random));
    add(rival.name, `你们最好快一点。${threat}已经知道这份委托存在。`);
    add("GM", `所有人的终端同时亮起，屏幕上只有一句话：“不要相信第一个找到${clue}的人。”`);
  } else if (beat === "初探") {
    add("GM", `${hero.name}与${ally.name}进入${location}。空气里残留着刚刚有人离开的温度。`);
    add(ally.name, `我找到${clue}了，但它像是故意留给我们的。`);
    const success = addRoll(6 + Math.max(0, config.intensity - 2), "追踪线索");
    add("GM", success ? `线索指向${rival.name}，同时证明${threat}正沿另一条路线逼近。` : `线索在最后一步断掉；更糟的是，${threat}循着判定的痕迹锁定了众人的位置。`);
    add(hero.name, `陷阱也会留下制作者的指纹。继续。`);
  } else if (beat === "受挫") {
    add("GM", `众人赶到${location}时，关键证据正在燃烧。${ally.name}为抢出${clue}付出了代价。`);
    add(ally.name, `别看我。先看证据——我们追错了人。`);
    const success = addRoll(7 + Math.max(0, config.intensity - 2), "抢救证据");
    add("GM", success ? `只剩半页的证据保住了一个名字，却也暴露了${hero.name}的行动。` : `${clue}彻底损毁，${hero.name}只能在同伴与任务之间立刻选择。`);
    add(rival.name, `这就是你们相信委托人的代价。`);
  } else if (beat === "假胜利") {
    add("GM", `${ninpo}撕开封锁，目标终于落入众人掌握。持续整夜的追逐似乎结束了。`);
    add(ally.name, `结束了……对吧？`);
    add("GM", `就在这一刻，${clue}自行展开。里面记录的不是敌方计划，而是众人刚刚完成的全部行动。`);
    add(hero.name, `不。这扇门不是被我们打开的，是有人借我们的手打开了它。`);
  } else if (beat === "反转") {
    add("GM", `${rival.name}没有攻击，只把武器放在地上。${threat}从黑暗里现身，证明此前的敌我关系全是伪装。`);
    add(rival.name, config.revealSecrets ? `我的秘密是：${rivalSecret}` : "你们知道的使命，只是被允许知道的那一半。", config.revealSecrets ? "reveal" : "dialogue");
    add(hero.name, config.revealSecrets ? `那么我也不再隐瞒：${secret}` : "看来，我们每个人都带着不能说的理由来到这里。", config.revealSecrets ? "reveal" : "dialogue");
    add("GM", `真相将${hero.name}的使命与${ally.name}的生存摆在了对立面。倒计时只剩十五分钟。`);
  } else if (beat === "至暗时刻") {
    add("GM", `${location}开始崩塌。通讯中断，退路封死，${threat}提出交换：交出一人，其余人便能离开。`);
    add(ally.name, `如果任务必须这样完成，我宁愿任务失败。`);
    add(rival.name, `漂亮的话救不了任何人。选吧，${hero.name}。`);
    const success = addRoll(8, "承受代价");
    add("GM", success ? `${hero.name}看穿交换条件中的漏洞，却必须永久放弃一项原本唾手可得的战果。` : `迟疑让倒计时归零。冲击吞没出口，众人再没有无伤离开的可能。`);
    add(hero.name, beliefLine(hero, beat, random));
  } else if (beat === "反击") {
    add("GM", `众人把此前所有失败留下的痕迹重新排列，终于拼出一条只有敌人才会相信的假路线。`);
    add(hero.name, `${ally.name}负责诱导，${rival.name}切断退路。我的${ninpo}只需要一次机会。`);
    const success = addRoll(7, "制造反攻窗口");
    add("GM", success ? `谎言成功骗过${threat}，战场第一次落入众人选择的位置。` : `诱饵被识破，但${ally.name}临时改变计划，把失败变成了更危险的近身机会。`);
  } else if (beat === "高潮") {
    add("GM", `${location}的核心完全开启。所有秘密、感情与未偿还的代价在同一刻压向${hero.name}。`);
    add(rival.name, `来吧。让我看看你的使命，究竟能不能胜过你的选择。`);
    add(hero.name, `${hero.ougi ? `奥义——${hero.ougi}。` : `${ninpo}，全力发动。`}这不是为了证明谁正确，而是为了让我们还有资格面对明天。`);
    const success = addRoll(config.ending === "任务失败" ? 9 : 8, "最终交锋");
    const outcome = config.ending === "任务失败" ? false : config.ending === "破晓逆转" ? true : success;
    add("GM", outcome ? `最后一击贯穿了${threat}的布局，但胜利没有抹去此前付出的代价。` : `攻击抵达前的瞬间，真正的目标从所有人的视野中消失。战斗结束，使命却没有完成。`);
  } else {
    const endings: Record<ReplayEnding, string> = {
      苦涩胜利: `任务报告写着“成功”。只有${hero.name}知道，${ally.name}没有带走原本最想守住的东西。`,
      破晓逆转: `第一束天光落进${location}。所有人都活着，而被认定无法改变的结局终于出现了一条裂缝。`,
      开放悬念: `众人离开后，${clue}再次亮起。屏幕上出现下一次任务的日期——正是昨天。`,
      任务失败: `官方记录将事件归为意外。数日后，${rival.name}收到一段只有${hero.name}可能留下的加密讯息。`,
    };
    add("GM", endings[config.ending]);
    add(ally.name, `所以，这就是我们选择的答案？`);
    add(hero.name, config.ending === "开放悬念" ? "不。只是下一幕开始之前的停顿。" : "答案不会替我们活下去。走吧。");
    add("GM", `远处传来城市恢复运转的声音。镜头停在${clue}上，随后切黑。`);
  }
  return lines;
}

export function formatReplayText(replay: Omit<GeneratedReplay, "text">) {
  let mainIndex = 0;
  const blocks = [
    `《${replay.title}》自动 Replay`,
    `类型：${replay.config.genre}｜篇幅：${replay.config.length}｜结局：${replay.config.ending}｜种子：${replay.seed}`,
    "※ 本文为本地戏剧化草稿，判定与规则效果仍以实际团务和 GM 裁定为准。",
  ];
  for (const scene of replay.scenes) {
    blocks.push("", sceneHeading(scene, mainIndex), `张力：${scene.tension}/100｜节拍：${scene.beat}`);
    if (scene.phase === "主要") mainIndex += 1;
    for (const line of scene.lines) blocks.push(`<${line.speaker}>${line.text}`);
    blocks.push("<GM>场景结束");
  }
  return blocks.join("\n");
}

export function generateReplay(characters: ReplayCharacter[], input: ReplayConfig): GeneratedReplay {
  const seed = input.seed.trim() || "shinobigami";
  const config = { ...input, seed, title: input.title.trim() || "未命名忍务" };
  const random = makeRandom(`${seed}|${config.title}|${config.genre}|${config.length}|${config.ending}|${config.intensity}`);
  const pcs = characters.filter((character) => character.role === "PC");
  const hero = characters.find((character) => character.id === config.protagonistId) ?? pcs[0] ?? characters[0] ?? fallbackCharacter("hero", "无名忍者", "PC");
  const ally = pcs.find((character) => character.id !== hero.id) ?? characters.find((character) => character.id !== hero.id) ?? fallbackCharacter("ally", "同行者", "PC");
  const rival = characters.find((character) => character.role === "NPC" && character.id !== hero.id) ?? characters.find((character) => character.id !== hero.id && character.id !== ally.id) ?? fallbackCharacter("rival", "蒙面忍者", "NPC");
  const details = GENRE_DETAILS[config.genre];
  const counters = { rolls: 0, successes: 0 };
  const selectedBeats = LENGTH_INDEXES[config.length].map((index) => BEATS[index]);
  const scenes = selectedBeats.map((blueprint, index): ReplayScene => {
    const tensionShift = blueprint.beat === "高潮" ? 0 : (config.intensity - 2) * (blueprint.tension >= 70 ? 5 : 3);
    const tension = Math.max(10, Math.min(100, blueprint.tension + tensionShift));
    return {
      id: `replay-scene-${index + 1}`,
      index: index + 1,
      phase: blueprint.phase,
      beat: blueprint.beat,
      title: pick(random, SCENE_TITLES[blueprint.beat]),
      tension,
      lines: makeSceneLines(blueprint.beat, { hero, ally, rival }, details, config, random, counters),
    };
  });
  const lineCount = scenes.reduce((sum, scene) => sum + scene.lines.length, 0);
  const base: Omit<GeneratedReplay, "text"> = {
    schemaVersion: 1,
    title: config.title,
    seed,
    createdAt: new Date().toISOString(),
    config,
    scenes,
    stats: { sceneCount: scenes.length, lineCount, rollCount: counters.rolls, successes: counters.successes, peakTension: Math.max(...scenes.map((scene) => scene.tension)) },
  };
  return { ...base, text: formatReplayText(base) };
}

export function normalizeGeneratedReplay(value: unknown): GeneratedReplay | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const replay = value as Partial<GeneratedReplay>;
  if (replay.schemaVersion !== 1 || typeof replay.title !== "string" || typeof replay.text !== "string" || !Array.isArray(replay.scenes)) return null;
  if (!replay.config || !replay.stats || typeof replay.seed !== "string") return null;
  return replay as GeneratedReplay;
}
