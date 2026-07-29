export type ReplayGenre = "都市悬疑" | "学园怪谈" | "黑色谍战" | "热血决战";
export type ReplayLength = "短篇" | "标准" | "长篇";
export type ReplayEnding = "苦涩胜利" | "破晓逆转" | "开放悬念" | "任务失败";
export type ReplayMode = "戏剧节拍" | "实战巡回";
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
  mode?: ReplayMode;
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
  cycle?: number;
  sceneType?: string;
  spotlightId?: string;
};

export type GeneratedReplay = {
  schemaVersion: 1 | 2;
  title: string;
  seed: string;
  createdAt: string;
  config: ReplayConfig;
  scenes: ReplayScene[];
  text: string;
  stats: { sceneCount: number; lineCount: number; rollCount: number; successes: number; peakTension: number; cycleCount?: number };
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

// 实战巡回模式专用素材池：全部原创，禁止引用官方文本或玩家 log。
const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

// 改订版感情名称，索引 0~5 对应 1D6；每项 [正面, 负面]。
const EMOTION_PAIRS: Array<[string, string]> = [["共感", "不信"], ["友情", "愤怒"], ["爱情", "嫉妒"], ["忠诚", "轻蔑"], ["憧憬", "自卑"], ["狂信", "杀意"]];

const HENCHOU_POOL = ["故障", "麻痹", "重伤", "行踪不明", "忘却", "诅咒"];

// 场景表（自建原创地点池，索引 0~5 对应 1D6）
const CAMPAIGN_SCENE_TABLE: Record<ReplayGenre, string[]> = {
  都市悬疑: ["末班车驶离后的空月台", "晾满湿衣的公寓天台", "只剩一盏灯的通宵洗衣店", "档案室深处的加密书架", "回声很响的高架涵洞", "凌晨三点的环形天桥"],
  学园怪谈: ["熄灯后的理科准备室", "堆满旧道具的戏剧社仓库", "月光穿堂而过的连廊", "锁链缠门的旧体育馆", "贴着褪色告示的顶楼楼梯间", "只在雨天开放的图书角"],
  黑色谍战: ["烟雾缭绕的地下酒吧包间", "临时租下的顶层观察点", "报废电车改装的接头点", "领事馆后巷的暗门", "只有回声的空停车场", "边境旅馆的双号房"],
  热血决战: ["立着百面旗帜的演武场", "俯瞰全城的钟楼残骸", "暴雨冲刷的河岸堤坝", "火把环绕的地下祭坛", "被封印符纸覆盖的桥头", "断成两截的巨大鸟居"],
};

const CAMPAIGN_SCENE_TITLES: Record<string, string[]> = {
  情报: ["顺着灰迹往回走", "档案背面的名字", "换来的半句口信", "监听风声"],
  感情: ["同一把伞下", "交换弱点的夜谈", "刀柄上的旧绳结", "无言的并肩"],
  回复: ["短暂的休整", "包扎与热茶", "屋檐下的喘息", "重新点亮的灯"],
  主持人: ["暗处的推手加码", "威胁露出獠牙", "包围网收紧", "对手的先手"],
  高潮: ["赌上全部布局的夜晚", "决战的信号", "最后的交锋"],
};

const INTRO_TITLES = ["接令之夜", "无声的动身", "潜入前夜", "雨中登场"];
const EPILOGUE_TITLES = ["各自的清晨", "未寄出的报告", "刀鞘归位", "留在原地的影子", "下一份委托之前"];
const EPILOGUE_PLACES = ["晨雾未散的渡口", "重新亮灯的旧事务所", "空无一人的顶楼", "刚开门的早餐铺"];
const FINALE_TITLES = ["灯火复明", "城市如常", "尾声的风"];

const INTEL_QUOTES = ["情报和刀一样，先出鞘的那把不一定是真的。", "给我十分钟，这里的灰尘会自己讲故事。", "问题不是找不找得到，是找到之后谁来背。"];
const BOND_QUOTES = ["难得没有警报的夜晚。说说吧，你为什么接这单。", "别误会，我只是顺路坐一会儿。", "如果明天散伙，今晚至少把话说完。"];
const REST_QUOTES = ["伤口不大。比起这个，先核对下一步。", "给我一刻钟，再上场时不会拖累任何人。", "热水、绷带、安静，这就够了。"];
const MASTER_LINES = ["让他们再快一点。猎物跑得越急，网收得越紧。", "把假情报放出去，我要看看谁先咬钩。", "不必拦截。他们正在替我打开那扇门。", "通知各处：从现在起，退路全部作废。"];
const ATTACK_CALLS = ["就是现在——", "看好了，这一手没有第二次。", "从影子里，取你的破绽。", "让开，或者被穿过。"];
const EPILOGUE_WIN_QUOTES = ["下一份委托来之前，先把刀磨好。", "名字留在暗处就好，活着的人记得就行。", "这次的账清了。下次的还没开页。"];
// 后日谈按信念分池，避免不同 PC 抽到同一句收尾
const EPILOGUE_BELIEF_QUOTES: Record<string, string[]> = {
  情: ["还有人记得今晚就好。其余的，风带走吧。", "把没说完的话收好，下次见面再还。"],
  忠: ["报告写完了。名字照旧，不署。", "命令完成之后，才轮得到自己的事。"],
  律: ["界线守住了。今晚可以睡个整觉。", "规矩没破，人也没丢。够了。"],
  我: ["答案是我自己选的，账也记我头上。", "别人怎么写这一晚随意，我记我的版本。"],
  和: ["都活着回来，就是最好的结算。", "下次换我请客。人齐了再开席。"],
  凶: ["刀还没钝。下一个对手，快点来。", "赢得不够痛快。留着这口气，下回补上。"],
};
const EPILOGUE_LOSE_QUOTES = ["输掉的东西，会由我亲手取回。", "记录留下了，教训也是。", "先低头养伤。抬头的时候，就是回礼的时候。"];

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

// 引用使命等已带句读的文本前剥去尾部标点，避免拼出「。。」；剥空时回退占位
function stripTail(text: string, fallback = "查明事件真相") {
  const stripped = text.replace(/[。．.！!？?，,、；;：:]+$/u, "");
  return stripped || fallback;
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
    add("GM", `${pick(random, details.openings)}。在${location}，${hero.name}收到一份没有署名的委托：${stripTail(objective)}。`);
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

function campaignSceneHeading(scene: ReplayScene, cycleSceneNo: number) {
  if (scene.sceneType === "导入") return `导入场景：${scene.title}`;
  if (scene.sceneType === "主持人") return `主持人场景：${scene.title}`;
  if (scene.sceneType === "高潮") return `高潮阶段：${scene.title}`;
  if (scene.sceneType === "后日谈") return scene.title;
  if (scene.sceneType === "尾声") return `尾声：${scene.title}`;
  const cycle = scene.cycle ?? 1;
  return `第${NUMERALS[cycle - 1] ?? cycle}循环·场景${NUMERALS[cycleSceneNo - 1] ?? cycleSceneNo}：${scene.title}`;
}

export function formatReplayText(replay: Omit<GeneratedReplay, "text">) {
  let mainIndex = 0;
  let cycleNo = 0;
  let cycleSceneNo = 0;
  const blocks = [
    `《${replay.title}》自动 Replay`,
    `类型：${replay.config.genre}｜篇幅：${replay.config.length}｜结局：${replay.config.ending}｜种子：${replay.seed}${replay.config.mode === "实战巡回" ? "｜模式：实战巡回" : ""}`,
    "※ 本文为本地戏剧化草稿，判定与规则效果仍以实际团务和 GM 裁定为准。",
  ];
  for (const scene of replay.scenes) {
    if (scene.sceneType) {
      if (scene.cycle && scene.sceneType !== "主持人") {
        if (scene.cycle !== cycleNo) {
          cycleNo = scene.cycle;
          cycleSceneNo = 0;
        }
        cycleSceneNo += 1;
      }
      blocks.push("", campaignSceneHeading(scene, cycleSceneNo), `张力：${scene.tension}/100｜类型：${scene.sceneType}`);
    } else {
      blocks.push("", sceneHeading(scene, mainIndex), `张力：${scene.tension}/100｜节拍：${scene.beat}`);
      if (scene.phase === "主要") mainIndex += 1;
    }
    for (const line of scene.lines) blocks.push(`<${line.speaker}>${line.text}`);
    blocks.push("<GM>场景结束");
  }
  return blocks.join("\n");
}

function generateCampaignReplay(characters: ReplayCharacter[], config: ReplayConfig): GeneratedReplay {
  const seed = config.seed;
  const random = makeRandom(`${seed}|${config.title}|${config.genre}|${config.length}|${config.ending}|${config.intensity}|实战巡回`);
  const pcs = characters.filter((character) => character.role === "PC");
  if (!pcs.length) pcs.push(fallbackCharacter("hero", "无名忍者", "PC"));
  const npcs = characters.filter((character) => character.role === "NPC");
  if (!npcs.length) npcs.push(fallbackCharacter("rival", "蒙面忍者", "NPC"));
  const hero = pcs.find((character) => character.id === config.protagonistId) ?? pcs[0];
  const npcMain = npcs[0];
  const details = GENRE_DETAILS[config.genre];
  const sceneTable = CAMPAIGN_SCENE_TABLE[config.genre];
  const counters = { rolls: 0, successes: 0 };
  const scenes: ReplayScene[] = [];

  const pushScene = (scene: Omit<ReplayScene, "id" | "index">) => {
    scenes.push({ id: `replay-scene-${scenes.length + 1}`, index: scenes.length + 1, ...scene });
  };
  const makeAdder = (key: string, lines: ReplayLine[]) => (speaker: string, text: string, kind: ReplayLine["kind"] = speaker === "GM" ? "narration" : "dialogue") =>
    lines.push({ id: `line-${key}-${lines.length + 1}`, speaker, text, kind });
  type Adder = ReturnType<typeof makeAdder>;
  const d6 = () => Math.floor(random() * 6) + 1;
  const tableRoll = (add: Adder, label: string, entries: string[]) => {
    const face = d6();
    counters.rolls += 1;
    add("SYSTEM", `${label}：1D6 ＞ ${face}，${entries[face - 1]}`, "roll");
    return entries[face - 1];
  };
  const logRoll = (add: Adder, speaker: string, target: number) => {
    const roll = roll2d6(random, target);
    counters.rolls += 1;
    if (roll.success) counters.successes += 1;
    add(speaker, `2D6 (2D6) ＞ ${roll.total}[${roll.dice[0]},${roll.dice[1]}] ＞ ${roll.total}，${roll.success ? "成功" : "失败"}`, "roll");
    return roll.success;
  };

  // 导入阶段：每个 PC 一幕专属导入
  for (const pc of pcs) {
    const lines: ReplayLine[] = [];
    const add = makeAdder(`intro-${pc.id}`, lines);
    add("GM", `${pick(random, details.openings)}。${pc.name}在此接下属于自己的委托：${stripTail(compact(pc.mission, "查明事件真相"))}。`);
    add(pc.name, beliefLine(pc, "引子", random));
    add("GM", `${pick(random, details.clues)}被留在${pc.name}手边，像一句迟到的提醒。任务，从此刻开始。`);
    pushScene({ phase: "导入", beat: "引子", sceneType: "导入", spotlightId: pc.id, title: `${pc.name}·${pick(random, INTRO_TITLES)}`, tension: 15 + Math.floor(random() * 16), lines });
  }

  // 主要阶段：按循环组织
  const cycleCount = config.length === "短篇" ? 2 : 3;
  const extraPerCycle = config.length === "长篇" ? 1 : 0;
  const cycleBeats: ReplayBeat[] = ["初探", "受挫", "反转"];
  for (let cycle = 1; cycle <= cycleCount; cycle += 1) {
    const beat = cycleBeats[Math.min(cycle - 1, cycleBeats.length - 1)];
    const spotlights = [...pcs];
    for (let extra = 0; extra < extraPerCycle; extra += 1) spotlights.push(pick(random, pcs));
    // 每循环至少一场情报、一场感情，其余按种子随机
    const types = spotlights.length >= 2 ? ["情报", "感情"] : [cycle % 2 === 1 ? "情报" : "感情"];
    while (types.length < spotlights.length) types.push(pick(random, ["情报", "感情", "回复"]));
    for (let i = types.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    const base = 35 + Math.round(((cycle - 1) * 25) / Math.max(1, cycleCount - 1));
    let cycleMaxTension = base;
    spotlights.forEach((spotlight, slot) => {
      const type = types[slot];
      const lines: ReplayLine[] = [];
      const add = makeAdder(`c${cycle}-s${slot + 1}`, lines);
      const location = tableRoll(add, "场景表", sceneTable);
      if (type === "情报") {
        const others = [...npcs, ...pcs.filter((character) => character.id !== spotlight.id)];
        const target = pick(random, others);
        const skill = pick(random, spotlight.skills?.length ? spotlight.skills : ["调查术"]);
        add("GM", `${location}。${spotlight.name}循着细碎的痕迹，追查${target.name}的底细。`);
        add(spotlight.name, pick(random, INTEL_QUOTES));
        add("GM", `${spotlight.name}以【${skill}】进行情报判定。`);
        const success = logRoll(add, spotlight.name, 6 + Math.max(0, config.intensity - 2));
        if (config.revealSecrets) {
          add("GM", success ? `${spotlight.name}获得了${target.name}的【秘密】：${compact(target.secret, "此人的过去被人为涂黑", 80)}` : `代价惨重，但残页仍拼出了${target.name}的【秘密】：${compact(target.secret, "此人的过去被人为涂黑", 80)}`, "reveal");
        } else {
          add("GM", success ? `${spotlight.name}摸到了那份秘密的轮廓，却按住没有说破。` : `情报在指间散开，只留下一个字迹模糊的代号。`);
        }
      } else if (type === "感情") {
        const partner = pcs.length > 1 ? pick(random, pcs.filter((character) => character.id !== spotlight.id)) : npcMain;
        add("GM", `${location}。${spotlight.name}与${partner.name}难得卸下了半分戒备。`);
        add(partner.name, pick(random, BOND_QUOTES));
        add("GM", `${spotlight.name}进行感情判定。`);
        const success = logRoll(add, spotlight.name, 6);
        const face = d6();
        counters.rolls += 1;
        const pair = EMOTION_PAIRS[face - 1];
        add("SYSTEM", `感情表：1D6 ＞ ${face}，${pair[0]}／${pair[1]}`, "roll");
        const spotSide = pair[random() < 0.7 ? 0 : 1];
        const partnerSide = pair[random() < 0.7 ? 0 : 1];
        add("GM", `${success ? "话音落定" : "沉默过后，反而是对方先递出了话头"}。${spotlight.name}对${partner.name}缔结感情【${spotSide}】，${partner.name}对${spotlight.name}回以【${partnerSide}】。`);
      } else {
        add("GM", `${location}。${spotlight.name}退到暗处，处理累积的伤势与消耗。`);
        add(spotlight.name, pick(random, REST_QUOTES));
        add("GM", `${spotlight.name}进行回复判定。`);
        const success = logRoll(add, spotlight.name, 6);
        add("GM", success ? `绷带收紧，${spotlight.name}的状态恢复到足以再战。` : `休整被一封急报打断，疲惫只压下去一半。`);
      }
      const tension = Math.min(75, base + slot * 4 + Math.floor(random() * 4));
      cycleMaxTension = Math.max(cycleMaxTension, tension);
      pushScene({ phase: "主要", beat, sceneType: type, cycle, spotlightId: spotlight.id, title: pick(random, CAMPAIGN_SCENE_TITLES[type]), tension, lines });
    });
    // 循环结尾：主持人场景（张力高于同循环各场景）
    const npc = npcs[(cycle - 1) % npcs.length];
    const threat = pick(random, details.threats);
    const lines: ReplayLine[] = [];
    const add = makeAdder(`c${cycle}-master`, lines);
    add("GM", `视角转向暗处。${threat}对整张棋盘重新落子。`);
    add(npc.name, pick(random, MASTER_LINES));
    add("GM", `包围网比上一刻又收紧一分。${pick(random, details.clues)}的下落，成了新的筹码。`);
    pushScene({ phase: "主要", beat, sceneType: "主持人", cycle, spotlightId: npc.id, title: pick(random, CAMPAIGN_SCENE_TITLES["主持人"]), tension: Math.min(92, cycleMaxTension + 5 + Math.floor(random() * 6)), lines });
  }

  // 高潮阶段：多轮战斗
  {
    const lines: ReplayLine[] = [];
    const add = makeAdder("climax", lines);
    const combatants = [...pcs, npcMain];
    const battlefield = tableRoll(add, "场景表", sceneTable);
    add("GM", `全员抵达${battlefield}。${pick(random, details.threats)}终于露出全貌，最终战开始。`);
    const rounds = config.length === "短篇" ? 2 : 2 + Math.floor(random() * 2);
    let henchouCount = 0;
    const inflictHenchou = (name: string) => {
      henchouCount += 1;
      add("SYSTEM", `${name}接害，获得变调【${pick(random, HENCHOU_POOL)}】`, "roll");
    };
    for (let round = 1; round <= rounds; round += 1) {
      add("GM", `——第${NUMERALS[round - 1]}轮——各自宣言谋位。`);
      const plots = combatants.map((combatant) => {
        const plot = d6();
        counters.rolls += 1;
        return { combatant, plot };
      });
      for (const entry of plots) add(entry.combatant.name, `1D6 布局 ＞ ${entry.plot}`, "roll");
      plots.sort((a, b) => b.plot - a.plot);
      for (const { combatant: actor } of plots) {
        const target = actor.role === "NPC" ? pick(random, pcs) : npcMain;
        if (round === rounds && actor.id === hero.id) {
          // 至少一次奥义解放与对应破解
          add(hero.name, `解放奥义【${hero.ougi?.trim() || "秘中秘"}】！`);
          add("GM", `${npcMain.name}以窥见的情报尝试奥义破解。`);
          const broken = logRoll(add, npcMain.name, 9);
          if (broken) {
            add("GM", `奥义的轨迹被读破，威力折半，但余波仍逼得${npcMain.name}后退半步。`);
          } else {
            add("GM", `破解失败，奥义完整命中！`);
            inflictHenchou(npcMain.name);
          }
          continue;
        }
        const ninpo = pick(random, actor.ninpoNames?.length ? actor.ninpoNames : ["接近战攻击"]);
        add(actor.name, pick(random, ATTACK_CALLS));
        add("GM", `${actor.name}以【${ninpo}】逼近${target.name}，命中判定。`);
        const hit = logRoll(add, actor.name, 7);
        if (!hit) {
          add("GM", `攻击擦过${target.name}的残影。`);
          continue;
        }
        add("GM", `${target.name}进行回避判定。`);
        const dodged = logRoll(add, target.name, 7);
        if (dodged) add("GM", `${target.name}贴着刃风闪开，反手压住了阵脚。`);
        else inflictHenchou(target.name);
      }
    }
    if (!henchouCount) inflictHenchou(config.ending === "任务失败" ? hero.name : npcMain.name);
    const endings: Record<ReplayEnding, string> = {
      苦涩胜利: `${npcMain.name}倒下的位置，恰好盖住了最初的委托书。任务完成，但每个人都清楚自己交出了什么。`,
      破晓逆转: `所有被视作败因的伏笔，在最后一枚骰子停下的瞬间反转成胜机。${npcMain.name}的野心随夜色一同退场。`,
      开放悬念: `${npcMain.name}在烟尘中留下半句预告便消失了。战斗结束了，事件没有。`,
      任务失败: `最后的防线仍旧迟了一步。${npcMain.name}带着目标遁入黑暗，只留下满地布局的残骸。`,
    };
    add("GM", endings[config.ending]);
    add(hero.name, config.ending === "任务失败" ? "记下这份败绩。下一次，由我们先落子。" : "收刀。把名字留给报告，把伤留给自己。");
    pushScene({ phase: "高潮", beat: "高潮", sceneType: "高潮", spotlightId: hero.id, title: pick(random, CAMPAIGN_SCENE_TITLES["高潮"]), tension: 100, lines });
  }

  // 结束阶段：每个 PC 一幕后日谈 + 收尾旁白
  const epilogueStart = Math.floor(random() * EPILOGUE_TITLES.length);
  pcs.forEach((pc, index) => {
    const lines: ReplayLine[] = [];
    const add = makeAdder(`epilogue-${pc.id}`, lines);
    add("GM", `${pick(random, EPILOGUE_PLACES)}。${pc.name}把这次任务的余波仔细折好、收进行囊。`);
    add(pc.name, pick(random, config.ending === "任务失败" ? EPILOGUE_LOSE_QUOTES : (EPILOGUE_BELIEF_QUOTES[(pc.belief ?? "").trim()] ?? EPILOGUE_WIN_QUOTES)));
    add("GM", `${pc.name}的身影没入人流，像从未在这场事件里出现过。`);
    pushScene({ phase: "结局", beat: "余韵", sceneType: "后日谈", spotlightId: pc.id, title: `后日谈：${pc.name}·${EPILOGUE_TITLES[(epilogueStart + index) % EPILOGUE_TITLES.length]}`, tension: 25 + Math.floor(random() * 16), lines });
  });
  {
    const lines: ReplayLine[] = [];
    const add = makeAdder("finale", lines);
    add("GM", `城市恢复了惯常的节奏，仿佛什么都没有发生过。`);
    add("GM", `只有几枚尚未冷却的骰子知道：下一场忍务，已经在暗处掷出了先手。`);
    pushScene({ phase: "结局", beat: "余韵", sceneType: "尾声", title: pick(random, FINALE_TITLES), tension: 25 + Math.floor(random() * 16), lines });
  }

  const lineCount = scenes.reduce((sum, scene) => sum + scene.lines.length, 0);
  const base: Omit<GeneratedReplay, "text"> = {
    schemaVersion: 2,
    title: config.title,
    seed,
    createdAt: new Date().toISOString(),
    config,
    scenes,
    stats: { sceneCount: scenes.length, lineCount, rollCount: counters.rolls, successes: counters.successes, peakTension: Math.max(...scenes.map((scene) => scene.tension)), cycleCount },
  };
  return { ...base, text: formatReplayText(base) };
}

export function generateReplay(characters: ReplayCharacter[], input: ReplayConfig): GeneratedReplay {
  const seed = input.seed.trim() || "shinobigami";
  const config = { ...input, seed, title: input.title.trim() || "未命名忍务" };
  if (config.mode === "实战巡回") return generateCampaignReplay(characters, config);
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
    schemaVersion: 2,
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
  // 同时接受 v1（旧档原样通过）与 v2
  if ((replay.schemaVersion !== 1 && replay.schemaVersion !== 2) || typeof replay.title !== "string" || typeof replay.text !== "string" || !Array.isArray(replay.scenes)) return null;
  if (!replay.config || !replay.stats || typeof replay.seed !== "string") return null;
  return replay as GeneratedReplay;
}
