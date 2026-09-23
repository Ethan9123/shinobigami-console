import { EMOTION_PAIRS, NO_SKILL, actionOrder, battleTargetCheck, canDeclareAttack, checkFumbleLine, clearBattleRoundState, freshCheckInputs, reanchorTurnIndex, resolveCheckOutcome, resolveDesignatedSkill, rollD6, uid } from "../../../lib/rules";
import { advanceResolutionAfterRoll, evasionSkill } from "../../../lib/session";
import type { Character } from "../../../lib/session";
import type { ConsoleBase } from "../types";
import type { RosterActions } from "./roster";

export function createCheckPanelActions(ctx: ConsoleBase) {
  const {
    setDiceCount, setLastRoll, setModifier, setReversalExempt, setSubstituteSkillChoice, setSupportCostInput,
  } = ctx;

  // 代用选择、修正、骰池、支援花费与逆止豁免都属于“这一次判定”，换人或换回合时不得沿用
  const resetCheckPanel = () => {
    const fresh = freshCheckInputs();
    setSubstituteSkillChoice(fresh.substituteSkillChoice);
    setModifier(fresh.modifier);
    setDiceCount(fresh.diceCount);
    setSupportCostInput(fresh.supportCost);
    setReversalExempt(fresh.reversalExempt);
    setLastRoll(null);
  };

  return {
    resetCheckPanel,
  };
}

export type CheckPanelActions = ReturnType<typeof createCheckPanelActions>;

export function createBattleActions(ctx: ConsoleBase & CheckPanelActions & RosterActions) {
  const {
    addLog, allNinpo, attackOverride, battleOrder, characters, check, checkpoint, currentActor, diceCount,
    inAttackWindow, inReversal, modifier, resetCheckPanel, resolution, resolutionTarget, revealed,
    reversalExempt, reversedCheck, round, samePlotBatch, selectCharacter, selected, selectedNinpo, setAttackOverride,
    setCharacters, setEmotions, setLastRoll, setResolution, setRevealed, setReversalExempt, setRound, setSelectedId,
    setSupportCostInput, setTargetSkill, setTreasureName, setTreasureNote, setTreasures, setTurnIndex,
    supportCostInput, target, targetSkill, treasureName, treasureNote, treasures, turnIndex,
    updateCharacter,
  } = ctx;

  // 场景结束即战斗结束：布局、花费、已用忍法与「逆止」只在该回合有效，不得带进后续场景或下一场战斗
  const closeBattle = () => {
    setRevealed(false);
    setTurnIndex(0);
    setAttackOverride(false);
    setReversalExempt(false);
    if (resolution) {
      if (resolution.stage !== "完成") addLog(`场景结束：【${resolution.ninpoName}】未完成的结算已关闭。`, "danger");
      setResolution(null);
    }
  };

  // 行动顺序变化后让 turnIndex 继续指向同一位当前行动者；当前行动者离开或被移后，由下一位等待者接手
  const reanchorTurn = (nextCharacters: Character[], movedId?: string) => {
    if (!revealed) return;
    const nextOrder = actionOrder(nextCharacters.filter((character) => character.active));
    const nextIndex = reanchorTurnIndex(battleOrder.map((character) => character.id), turnIndex, nextOrder.map((character) => character.id), movedId);
    setTurnIndex(nextIndex);
    const nextActor = nextOrder[nextIndex];
    if (nextActor && nextActor.id !== currentActor?.id) {
      resetCheckPanel();
      setSelectedId(nextActor.id);
      addLog(`行动顺序已调整：轮到 ${nextActor.name} 行动。`, "system");
    }
  };

  const setPlot = (character: Character, plot: number) => {
    checkpoint();
    updateCharacter(character.id, { plot });
    if (plot <= 0) {
      // 布局违规在公开时才判明：记为 0 不重新隐藏布局
      addLog(`${character.name} 布局违规（无骰、骰数超出或超出限制范围），布局值记为 0：行动排在最后，大失败值为 2，布局 1 以上的角色攻击其时无视距离。`, "danger");
      // 公开后改为 0 会改变行动顺序：保持当前行动者；若改的正是当前行动者，由下一位接手
      if (character.plot !== plot) reanchorTurn(characters.map((item) => item.id === character.id ? { ...item, plot } : item), character.id);
      return;
    }
    setRevealed(false);
    addLog(`${character.name} 已秘密设置布局。`, "system");
  };

  const revealPlots = () => {
    checkpoint();
    setRevealed(true);
    setTurnIndex(0);
    if (battleOrder[0]) selectCharacter(battleOrder[0].id);
    const summary = battleOrder.map((character) => `${character.name} ${character.plot ?? "?"}`).join("／");
    addLog(`布局公开：${summary}`, "action");
  };

  const advanceTurn = () => {
    if (!revealed || !battleOrder.length) return;
    if (resolution && resolution.stage !== "完成") {
      addLog(`不能切换行动者：当前结算仍停在「${resolution.stage}」。`, "danger");
      return;
    }
    checkpoint();
    setResolution(null);
    resetCheckPanel();
    setAttackOverride(false);
    const nextIndex = (turnIndex + 1) % battleOrder.length;
    setTurnIndex(nextIndex);
    setSelectedId(battleOrder[nextIndex].id);
    addLog(nextIndex === 0 ? "本回合所有角色均已行动。" : `轮到 ${battleOrder[nextIndex].name} 行动。`, "system");
  };

  const newRound = () => {
    if (resolution && resolution.stage !== "完成") {
      addLog(`不能开始新回合：当前结算仍停在「${resolution.stage}」。`, "danger");
      return;
    }
    checkpoint();
    setResolution(null);
    setRound((value) => value + 1);
    setRevealed(false);
    resetCheckPanel();
    setAttackOverride(false);
    setTurnIndex(0);
    setCharacters((items) => items.map(clearBattleRoundState));
    setEmotions((items) => items.map((emotion) => ({ ...emotion, used: false })));
    addLog(`进入第 ${round + 1} 回合，请重新设置布局。`, "system");
  };

  const rollCheck = () => {
    if (!selected) return;
    checkpoint();
    const skillPhraseFor = check.skill === targetSkill ? `以${check.skill}判定` : `以${check.skill}代用${targetSkill}`;
    if (reversedCheck) {
      // 逆止中的行为判定自动失败、达成值视为 0，不掷骰
      const { result, achieved } = resolveCheckOutcome({ raw: 0, target: check.target, reversed: true });
      setLastRoll({ dice: [], kept: [], total: achieved, result });
      if (resolution) setResolution(advanceResolutionAfterRoll(resolution, selected.id, result));
      addLog(`${selected.name} 处于逆止：${skillPhraseFor}的行为判定自动失败（达成值视为 0）。`, "danger");
      return;
    }
    const dice = Array.from({ length: diceCount }, () => rollD6());
    const kept = [...dice].sort((a, b) => b - a).slice(0, 2);
    const raw = kept[0] + kept[1];
    const fumbleLine = checkFumbleLine({ inAttackWindow, plot: selected.plot, supportCost: inAttackWindow ? 0 : supportCostInput });
    const { result, achieved: total } = resolveCheckOutcome({
      raw,
      modifier,
      target: check.target,
      criticalOnly: check.criticalOnly,
      fumbleLine,
      inAttackWindow,
      reversed: inReversal,
      reversalExempt,
    });
    setLastRoll({ dice, kept, total, result });
    if (resolution) setResolution(advanceResolutionAfterRoll(resolution, selected.id, result));
    const command = `${diceCount > 2 ? diceCount : ""}SG@12#${fumbleLine}>=${check.criticalOnly ? 99 : check.target}`;
    const poolText = diceCount > 2 ? `${dice.join(",")} → 取高 ${kept.join("+")}` : kept.join("+");
    addLog(`[${command}] ${selected.name} ${skillPhraseFor}：${poolText}${modifier ? ` ${modifier > 0 ? "+" : ""}${modifier}` : ""}＝${total}，${result}${inReversal ? "（逆止中：按奥义／可在逆止中使用的效果进行）" : ""}。`, result.includes("失败") ? "danger" : "roll");
    if (result.includes("逆止") && !selected.conditions.includes("逆止")) {
      if (samePlotBatch.length > 1) {
        // 同时攻击：伤害、逆止与变调须待同布局全员完成攻击处理后统一应用
        addLog(`${selected.name} 的【逆止】暂缓生效：待布局 ${selected.plot} 的同速角色全部完成攻击处理后，再统一应用（届时手动点选逆止）。`, "system");
      } else {
        updateCharacter(selected.id, { conditions: [...selected.conditions, "逆止"] });
      }
    }
  };

  const rollEmotionTable = () => {
    const value = rollD6();
    const pair = EMOTION_PAIRS[value - 1];
    addLog(`[ET] 感情表：1D6=${value} → ${pair[0]}／${pair[1]}（双方各掷一次，正负自选）。`, "roll");
  };

  const rollTableHint = (command: string, tableName: string) => {
    addLog(`[${command}] ${tableName}出目：1D6=${rollD6()}——效果请对照规则书的${tableName}。`, "roll");
  };

  const declareNinpo = () => {
    if (!selected || !target) return;
    if (resolution && resolution.stage !== "完成") {
      addLog(`请先完成【${resolution.ninpoName}】的当前结算。`, "danger");
      return;
    }
    const targetCheck = battleTargetCheck({ attackerPlot: selected.plot, targetPlot: target.plot, range: selectedNinpo.range });
    const distance = targetCheck.distance;
    const problems: string[] = [];
    if (!targetCheck.ok && targetCheck.reason) problems.push(targetCheck.reason);
    // 「自由」忍法必须先在习得时选定指定特技，不能沿用判定面板上残留的特技
    const designation = resolveDesignatedSkill(selectedNinpo, selected.ninpoSkills ?? {});
    if (designation.needsChoice) problems.push(`【${selectedNinpo.name}】尚未指定特技（请在忍法卡或角色工作台的忍法配置里选定）`);
    const attackedThisTurn = (selected.usedNinpoIds ?? []).some((id) => allNinpo.find((ninpo) => ninpo.id === id)?.kind === "攻击");
    problems.push(...canDeclareAttack({
      kind: selectedNinpo.kind,
      revealed,
      actorId: selected.id,
      currentActorId: currentActor?.id,
      currentActorName: currentActor?.name,
      attackedThisTurn,
      gmOverride: attackOverride,
    }));
    const nextCost = (selected.spentCost ?? 0) + selectedNinpo.cost;
    // 布局时（未公开）使用支援忍法：花费可超过布局值，但合计不得达到 7，且此后本回合不能再用带花费忍法（由 GM 把关）
    const plotWindowSupport = !revealed && selectedNinpo.kind === "支援";
    if (selected.plot != null && nextCost > selected.plot) {
      if (plotWindowSupport && nextCost < 7) {
        addLog(`${selected.name} 在布局时使用【${selectedNinpo.name}】：花费合计 ${nextCost} 超过布局值（规则允许，上限 7），此回合不能再使用带花费的忍法。`, "system");
      } else {
        problems.push(plotWindowSupport ? `布局时支援忍法花费合计 ${nextCost} 不得达到 7` : `累计花费 ${nextCost} 超过布局 ${selected.plot}`);
      }
    }
    if ((selectedNinpo.kind === "支援" || selectedNinpo.kind === "攻击") && (selected.usedNinpoIds ?? []).includes(selectedNinpo.id)) problems.push(`同名${selectedNinpo.kind}忍法本回合已经使用`);
    if (problems.length) {
      addLog(`${selected.name} 无法对 ${target.name} 使用【${selectedNinpo.name}】：${problems.join("；")}。`, "danger");
      return;
    }
    checkpoint();
    resetCheckPanel();
    // 支援忍法的指定特技判定，大失败值上升该忍法的花费（攻击处理窗口内改用布局值，不叠加）
    if (!inAttackWindow && selectedNinpo.kind === "支援" && selectedNinpo.cost > 0) setSupportCostInput(selectedNinpo.cost);
    const overridden = attackOverride && selectedNinpo.kind === "攻击";
    setAttackOverride(false);
    // 「可变」忍法沿用判定面板当前选择的特技；其余一律锚定到解析出的实际指定特技
    const actualSkill = designation.variable ? targetSkill : designation.skill;
    if (actualSkill) setTargetSkill(actualSkill);
    updateCharacter(selected.id, {
      spentCost: nextCost,
      usedNinpoIds: [...(selected.usedNinpoIds ?? []), selectedNinpo.id],
    });
    setResolution({
      id: uid("resolution"),
      actorId: selected.id,
      targetId: target.id,
      ninpoId: selectedNinpo.id,
      ninpoName: selectedNinpo.name,
      ninpoKind: selectedNinpo.kind,
      skill: selectedNinpo.skill,
      designatedSkill: actualSkill ?? undefined,
      // 指定特技为「无」的忍法不进行行为判定，直接进入同一时机的宣言窗口
      ...(designation.noCheck ? { stage: "反应窗口" as const, attackOutcome: "无需判定" } : { stage: "命中判定" as const }),
    });
    const distanceNote = distance == null ? "" : targetCheck.exempt ? `（目标布局 0：无视距离）` : `（距离 ${distance}）`;
    const skillNote = actualSkill && actualSkill !== selectedNinpo.skill ? `以《${actualSkill}》` : "";
    addLog(`${selected.name} 对 ${target.name} ${skillNote}宣言【${selectedNinpo.name}】${distanceNote}${overridden ? "［GM 覆盖攻击限制］" : ""}。${designation.noCheck ? "指定特技为「无」，无需行为判定。" : ""}${selectedNinpo.damage ? `命中：${selectedNinpo.damage}。` : ""}`, "action");
  };

  const beginDefense = () => {
    if (!resolution || resolution.stage !== "反应窗口" || resolution.ninpoKind !== "攻击" || !resolutionTarget) return;
    checkpoint();
    setResolution({ ...resolution, stage: "回避判定" });
    resetCheckPanel();
    setSelectedId(resolutionTarget.id);
    // 回避判定使用攻击忍法的指定特技（「自由」忍法锚定到宣言时解析出的特技）
    const evasion = evasionSkill(resolution);
    if (evasion) setTargetSkill(evasion);
    const evasionNote = evasion
      ? `（指定特技《${evasion}》）`
      : resolution.skill === NO_SKILL
        ? "（攻击忍法的指定特技为「无」：回避方式按忍法说明由 GM 裁定，需要判定时请在判定面板手动选择）"
        : "（旧存档未记录攻击方指定特技，请在判定面板手动选择）";
    addLog(`宣言窗口关闭，轮到 ${resolutionTarget.name} 进行回避判定${evasionNote}。`, "system");
  };

  const skipDefense = () => {
    if (!resolution || resolution.stage !== "反应窗口") return;
    checkpoint();
    setResolution({ ...resolution, stage: "效果结算" });
    addLog(`同一时机的宣言窗口关闭，进入【${resolution.ninpoName}】效果结算。`, "system");
  };

  const confirmResolutionEffects = () => {
    if (!resolution || resolution.stage !== "效果结算") return;
    checkpoint();
    setResolution({ ...resolution, stage: "完成" });
    addLog(`【${resolution.ninpoName}】的伤害、变调与附带效果已确认。`, "action");
  };

  const dismissResolution = () => {
    if (!resolution) return;
    checkpoint();
    addLog(
      resolution.stage === "完成" ? `【${resolution.ninpoName}】结算已归档。` : `GM 跳过了【${resolution.ninpoName}】剩余结算。`,
      resolution.stage === "完成" ? "system" : "danger",
    );
    setResolution(null);
  };

  const addTreasure = () => {
    const name = treasureName.trim();
    if (!name) return;
    checkpoint();
    setTreasures((items) => [...items, { id: uid("treasure"), name, holderId: characters[0]?.id ?? "", note: treasureNote.trim() }]);
    setTreasureName("");
    setTreasureNote("");
    addLog(`秘宝〈${name}〉已登记，当前由 ${characters[0]?.name ?? "无人"} 持有。`, "system");
  };

  const removeTreasure = (treasureId: string) => {
    const treasure = treasures.find((item) => item.id === treasureId);
    if (!treasure) return;
    checkpoint();
    setTreasures((items) => items.filter((item) => item.id !== treasureId));
    addLog(`秘宝〈${treasure.name}〉已从桌面移除。`, "system");
  };

  const transferTreasure = (treasureId: string, targetId: string) => {
    const treasure = treasures.find((item) => item.id === treasureId);
    const nextHolder = characters.find((character) => character.id === targetId);
    if (!treasure || !nextHolder || treasure.holderId === nextHolder.id) return;
    checkpoint();
    setTreasures((items) => items.map((item) => item.id === treasureId ? { ...item, holderId: nextHolder.id } : item));
    const fromName = characters.find((character) => character.id === treasure.holderId)?.name ?? "无人";
    addLog(`秘宝〈${treasure.name}〉由 ${fromName} 让渡给 ${nextHolder.name}。`, "action");
  };

  return {
    closeBattle, reanchorTurn, setPlot, revealPlots, advanceTurn, newRound, rollCheck, rollEmotionTable,
    rollTableHint, declareNinpo, beginDefense, skipDefense, confirmResolutionEffects, dismissResolution, addTreasure,
    removeTreasure, transferTreasure,
  };
}

export type BattleActions = ReturnType<typeof createBattleActions>;
