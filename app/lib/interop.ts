import { FIELD_NAMES, SKILL_TABLE, nearestSkill, resolveDesignatedSkill } from "./rules";
import type { Ninpo } from "./rules";
import type { Character } from "./session";

export type InteropOptions = {
  includePrivate?: boolean;
  special?: number;
  fumble?: number;
};

export type CCFoliaClipboardCharacter = {
  kind: "character";
  data: {
    name: string;
    memo: string;
    initiative: number;
    externalUrl: string;
    status: Array<{ label: string; value: number; max: number }>;
    params: Array<{ label: string; value: string }>;
    iconUrl: string;
    faces: unknown[];
    x: number;
    y: number;
    angle: number;
    width: number;
    height: number;
    active: boolean;
    secret: boolean;
    invisible: boolean;
    hideStatus: boolean;
    color: string;
    roomId: null;
    commands: string;
  };
};

type FoundryItem = {
  name: string;
  type: "ability" | "background" | "finish" | "item" | "handout";
  system: Record<string, unknown>;
};

export type FoundryActorExport = {
  name: string;
  type: "character";
  system: Record<string, unknown>;
  items: FoundryItem[];
  flags: { shinobigamiConsole: { schemaVersion: 1; exportedAt: string } };
};

function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

function learnedNinpo(character: Character, ninpo: Ninpo[]) {
  return ninpo.filter((item) => character.ninpoIds.includes(item.id));
}

function availableSkills(character: Character) {
  return character.skills.filter((skill) => {
    const field = FIELD_NAMES.find((name) => SKILL_TABLE[name].includes(skill));
    return field ? character.life[field] : true;
  });
}

function sgCommand(target: number, label: string, special: number, fumble: number) {
  return `SG@${special}#${fumble}>=${target} 【${label}】`;
}

/**
 * 生成 BCDice ShinobiGami 的公开命令调色板。
 * 命令语法对齐 nSG@s#f>=x；表格只输出命令名，不内置表格正文。
 */
export function createBCDicePalette(character: Character, ninpo: Ninpo[], options: InteropOptions = {}) {
  const special = Math.max(2, Math.min(12, Math.floor(options.special ?? 12)));
  const fumble = Math.max(2, Math.min(12, Math.floor(options.fumble ?? 2)));
  const usable = availableSkills(character);
  const commands: string[] = [];

  for (const skill of character.skills) {
    const field = FIELD_NAMES.find((name) => SKILL_TABLE[name].includes(skill));
    commands.push(sgCommand(field && !character.life[field] ? 12 : 5, skill, special, fumble));
  }

  for (const item of learnedNinpo(character, ninpo)) {
    if (item.kind === "装备") continue;
    // 「自由」忍法按习得时选定的特技出命令；尚未指定、「无」或「可变」的忍法没有固定目标值，不输出
    const designated = resolveDesignatedSkill(item, character.ninpoSkills ?? {}).skill;
    if (!designated) continue;
    const check = nearestSkill(usable, designated, character.closedGaps);
    const substitute = check.skill !== designated ? `→${check.skill}` : "";
    commands.push(sgCommand(check.criticalOnly ? 99 : check.target, `${item.name}／${designated}${substitute}`, special, fumble));
  }

  commands.push("ET 感情表", "FT ファンブル表", "WT 変調表", "BT 戦场表", "ST 场景表", "RCT 随机分野", "RTT 随机特技");
  return Array.from(new Set(commands)).join("\n");
}

function publicMemo(character: Character, includePrivate: boolean) {
  const faction = [clean(character.faction), clean(character.subFaction)].filter(Boolean).join("・");
  const lines = [
    character.player ? `【玩家】${character.player}` : "",
    faction ? `【流派】${faction}` : "",
    character.rank ? `【阶级】${character.rank}` : "",
    character.cover ? `【表之颜】${character.cover}` : "",
    character.belief ? `【信念】${character.belief}` : "",
    character.mission ? `【使命】${character.mission}` : "",
  ];
  if (includePrivate) {
    if (character.secret) lines.push(`【秘密】${character.secret}`);
    if (character.ougi) lines.push(`【奥义】${character.ougi}${character.ougiSkill ? `／${character.ougiSkill}` : ""}`);
  }
  return lines.filter(Boolean).join("\n");
}

/** 生成可直接粘贴到 CCFOLIA 的角色剪贴板 JSON。 */
export function createCCFoliaCharacter(character: Character, ninpo: Ninpo[], options: InteropOptions = {}): CCFoliaClipboardCharacter {
  const includePrivate = options.includePrivate === true;
  const status = FIELD_NAMES.map((field) => ({ label: field, value: character.life[field] ? 1 : 0, max: 1 }));
  if (character.extraLife > 0) status.push({ label: "追加生命力", value: character.extraLife, max: character.extraLife });
  const faction = [clean(character.faction), clean(character.subFaction)].filter(Boolean).join("・");
  const params = [
    { label: "流派", value: faction },
    { label: "阶级", value: clean(character.rank) },
    { label: "信念", value: clean(character.belief) },
    { label: "条件", value: clean(character.condition) },
    { label: "流仪", value: clean(character.style) },
  ].filter((item) => item.value);

  return {
    kind: "character",
    data: {
      name: character.name,
      memo: publicMemo(character, includePrivate),
      initiative: character.plot ?? 0,
      externalUrl: "",
      status,
      params,
      iconUrl: character.portrait?.startsWith("https://") ? character.portrait : "",
      faces: [],
      x: 0,
      y: 0,
      angle: 0,
      width: 4,
      height: 4,
      active: character.active,
      secret: false,
      invisible: false,
      hideStatus: false,
      color: character.role === "PC" ? "#1c8b78" : "#c83a32",
      roomId: null,
      commands: createBCDicePalette(character, ninpo, options),
    },
  };
}

function foundryTalentTable(character: Character) {
  const usable = availableSkills(character);
  return FIELD_NAMES.map((field) => SKILL_TABLE[field].map((skill) => {
    const check = nearestSkill(usable, skill, character.closedGaps);
    return {
      state: character.skills.includes(skill),
      num: String(check.criticalOnly ? 99 : check.target),
      stop: false,
      expert: false,
    };
  }));
}

function foundryItems(character: Character, ninpo: Ninpo[], includePrivate: boolean): FoundryItem[] {
  const items: FoundryItem[] = learnedNinpo(character, ninpo).map((item) => ({
    name: item.name,
    type: "ability",
    system: {
      type: item.kind,
      talent: resolveDesignatedSkill(item, character.ninpoSkills ?? {}).skill ?? "",
      gap: item.range >= 99 ? "" : String(item.range),
      cost: item.cost ? String(item.cost) : "",
      hidden: false,
      curse: false,
      description: [item.summary, item.damage, item.note].filter(Boolean).join("\n"),
    },
  }));

  items.push(...character.backgroundItems.map((item) => ({
    name: item.name,
    type: "background" as const,
    system: { type: item.points < 0 ? "cons" : "pros", exp: Math.abs(item.points), description: item.effect },
  })));
  for (const [name, quantity] of Object.entries(character.tools)) {
    if (quantity > 0) items.push({ name, type: "item", system: { description: "", quantity } });
  }
  if (includePrivate && character.ougi) {
    items.push({
      name: character.ougi,
      type: "finish",
      system: {
        type: clean(character.ougiEffect),
        talent: clean(character.ougiSkill),
        visible: {},
        description: [character.ougiStrength, character.ougiWeakness].filter(Boolean).join("\n"),
      },
    });
  }
  if (includePrivate && character.secret) {
    items.push({
      name: "使命与秘密",
      type: "handout",
      system: { visible: {}, sVisible: {}, description: character.mission, secret: character.secret },
    });
  }
  return items;
}

/** 生成 ksx0330/FVTT-Shinobigami-System 可识别的 Actor JSON 结构。 */
export function createFoundryActor(character: Character, ninpo: Ninpo[], options: InteropOptions = {}): FoundryActorExport {
  const includePrivate = options.includePrivate === true;
  const state = Object.fromEntries(FIELD_NAMES.map((field, index) => [String(index), !character.life[field]]));
  const dirty = Object.fromEntries(FIELD_NAMES.map((_, index) => [String(index), false]));
  const gap = Object.fromEntries([0, 1, 2, 3, 4, 5].map((index) => [String(index), index === 0 ? false : character.closedGaps[index - 1] === true]));
  const life = FIELD_NAMES.filter((field) => character.life[field]).length + character.extraLife;

  return {
    name: character.name,
    type: "character",
    system: {
      health: { value: life, min: 0, max: 6 + character.extraLife, state, dirty },
      talent: {
        table: foundryTalentTable(character),
        gap,
        curiosity: 0,
        overflowX: false,
        overflowY: false,
        yoma: false,
        subTitle: { id: "", title: "", state: false },
      },
      details: {
        age: clean(character.age),
        sex: clean(character.gender),
        purpose: character.mission,
        identify: clean(character.cover),
        belief: clean(character.belief),
        exp: character.merit ?? 0,
        expContent: "",
        biography: [character.surface, character.story].filter(Boolean).join("\n"),
        agency: [clean(character.faction), clean(character.subFaction)].filter(Boolean).join("・"),
        grade: character.rank,
      },
    },
    items: foundryItems(character, ninpo, includePrivate),
    flags: { shinobigamiConsole: { schemaVersion: 1, exportedAt: new Date().toISOString() } },
  };
}

export function serializeInterop(value: unknown) {
  return JSON.stringify(value, null, 2);
}
