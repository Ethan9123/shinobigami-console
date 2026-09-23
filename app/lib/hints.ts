import type { ReadinessIssue } from "./rules";
import type { Character, Phase, Resolution, SceneAction, SceneCue } from "./session";

export type SmartHint = { tone: "good" | "warn" | "danger"; title: string; detail: string };

export type SmartHintInput = {
  characters: Character[];
  phase: Phase;
  prepBlockers: ReadinessIssue[];
  prepWarningCount: number;
  sceneParticipantIds: string[];
  sceneOwnerId: string;
  sceneAction: SceneAction;
  battleOrder: Character[];
  revealed: boolean;
  resolution: Resolution | null;
  resolutionActorName: string | undefined;
  availableSkillCount: number;
  selected: Character | undefined;
  dueCues: SceneCue[];
  tableSafe: boolean;
};

export function buildSmartHints(input: SmartHintInput): SmartHint[] {
  const {
    characters, phase, prepBlockers, prepWarningCount, sceneParticipantIds, sceneOwnerId, sceneAction, battleOrder,
    revealed, resolution, resolutionActorName, availableSkillCount, selected, dueCues, tableSafe,
  } = input;
  const hints: SmartHint[] = [];
  const pcs = characters.filter((character) => character.role === "PC");
  if (phase === "导入") {
    hints.push(prepBlockers.length
      ? { tone: "danger", title: `${prepBlockers.length} 项开团阻塞`, detail: prepBlockers.slice(0, 3).map((issue) => issue.message).join("；") }
      : { tone: "good", title: "开团门禁已通过", detail: prepWarningCount ? `仍有 ${prepWarningCount} 项可由 GM 确认的提醒。` : "公告、PC 位与角色卡均已确认。" });
  }
  if (phase === "主要") {
    const waiting = pcs.filter((character) => !character.acted);
    hints.push(waiting.length
      ? { tone: "warn", title: `${waiting.length} 位尚未行动`, detail: waiting.map((item) => item.name).join("、") }
      : { tone: "good", title: "本巡行动已完成", detail: "可以结算巡末效果并开始新巡。" });
    if (!sceneParticipantIds.includes(sceneOwnerId)) hints.push({ tone: "danger", title: "场景玩家未登场", detail: "将场景玩家加入登场人物后再完成场景。" });
    if (sceneAction === "未定") hints.push({ tone: "warn", title: "尚未选择主要行动", detail: "回复、情报、感情、战斗或计划判定只能择一作为主要行动。" });
  }
  if (phase === "高潮") {
    const unset = characters.filter((character) => character.active && character.plot == null);
    if (unset.length) hints.push({ tone: "danger", title: "布局尚未齐全", detail: unset.map((item) => item.name).join("、") });
    const ties = battleOrder.filter((item, index) => index > 0 && item.plot === battleOrder[index - 1].plot);
    if (revealed && ties.length) hints.push({ tone: "warn", title: "存在同布局角色", detail: "请按桌上约定或随机方式决定同布局内的处理顺序。" });
  }
  if (resolution && resolution.stage !== "完成") {
    hints.push({ tone: "danger", title: `结算停在「${resolution.stage}」`, detail: `${resolutionActorName ?? "行动者"} 的【${resolution.ninpoName}】尚未完成，不应直接跳到下一位。` });
  }
  if (!availableSkillCount) hints.push({ tone: "danger", title: `${selected?.name ?? "角色"} 没有可用特技`, detail: "失去生命力的分野或被麻痹封锁的特技不能用于代用；只有大成功才可能成功。" });
  if (selected?.paralyzedSkills?.length) hints.push({ tone: "warn", title: `${selected.name} 麻痹×${selected.paralyzedSkills.length}`, detail: `被封特技：${selected.paralyzedSkills.map((skill) => `《${skill}》`).join("")}；每巡结束可用《身体操术》判定，成功则全部解除。` });
  if (selected && selected.conditions.includes("麻痹") && !selected.paralyzedSkills?.length) hints.push({ tone: "warn", title: "旧存档未记录被封特技，请补抽", detail: `${selected.name} 带有「麻痹」标签，但没有记录封锁了哪个特技；在变调栏点「麻痹」补抽一层，或点「全部解除」。` });
  if (selected && selected.plot != null && selected.spentCost >= selected.plot) hints.push({ tone: "warn", title: "本回合花费已用尽", detail: `${selected.name} 已使用 ${selected.spentCost}/${selected.plot}。` });
  if (dueCues.length) hints.push({ tone: "danger", title: `${dueCues.length} 个主持事件已到点`, detail: tableSafe ? "请切回 GM 视图查看事件内容。" : dueCues.map((cue) => cue.title).join("、") });
  if (!selected?.mission.trim()) hints.push({ tone: "warn", title: "使命尚未填写", detail: "角色卡导入或场景推进前补齐，便于结局检查。" });
  if (!hints.length) hints.push({ tone: "good", title: "当前状态无明显冲突", detail: "可以继续推进场景或判定。" });
  return hints;
}
