import { useMemo } from "react";
import { calculateSpotlightLedger, generateSceneDeck } from "../../lib/director";
import { createGmBrief } from "../../lib/gm";
import { COMMON_NINPO, actionOrder, calculateCheckOdds, checkFumbleLine, designatedSkillChoices, evaluateSessionReadiness, factionSpecialty, matchesSpecialtyGaps, nearestSkill, parseCharacterText, resolveDesignatedSkill, skillTableOptions, substituteSkill, usableSkills } from "../../lib/rules";
import { buildSmartHints } from "../../lib/hints";
import type { GameStore } from "./store/useGameStore";
import type { ConsoleUi } from "./useConsoleUi";

export function useConsoleDerived(state: GameStore & ConsoleUi) {
  const {
    brief, characters, cues, customNinpo, cycle, diceCount, emotions, gmBeat, gmPressure, handouts, importText,
    intel, lockedSceneCards, logs, modifier, phase, resolution, revealed, reversalExempt, sceneAction,
    sceneDeckNonce, sceneNumber, sceneOwnerId, sceneParticipantIds, selectedId, selectedNinpoId,
    substituteSkillChoice, supportCostInput, tableSafe, targetId, targetSkill, trackers, transcript, transcriptQuery,
    transcriptSceneId, transcriptSpeaker, turnIndex, view,
  } = state;

  const selected = characters.find((character) => character.id === selectedId) ?? characters[0];
  const target = characters.find((character) => character.id === targetId && character.id !== selected?.id && character.active)
    ?? characters.find((character) => character.id !== selected?.id && character.active);
  const allNinpo = useMemo(() => [...COMMON_NINPO, ...customNinpo], [customNinpo]);
  const replayCast = useMemo(() => characters.map((character) => ({
    id: character.id,
    name: character.name,
    role: character.role,
    faction: character.faction,
    mission: character.mission,
    secret: character.secret,
    belief: character.belief,
    story: character.story,
    ougi: character.ougi,
    skills: character.skills,
    ninpoNames: character.ninpoIds.map((id) => allNinpo.find((ninpo) => ninpo.id === id)?.name).filter((name): name is string => Boolean(name)),
  })), [allNinpo, characters]);
  const requestedNinpo = allNinpo.find((ninpo) => ninpo.id === selectedNinpoId);
  const firstActiveNinpo = allNinpo.find((ninpo) => selected?.ninpoIds.includes(ninpo.id) && ninpo.kind !== "装备");
  const activeNinpoId = selected?.ninpoIds.includes(selectedNinpoId) && requestedNinpo?.kind !== "装备" ? selectedNinpoId : firstActiveNinpo?.id ?? "close";
  const selectedNinpo = allNinpo.find((ninpo) => ninpo.id === activeNinpoId) ?? COMMON_NINPO[0];
  const learnedNinpo = selected ? allNinpo.filter((ninpo) => selected.ninpoIds.includes(ninpo.id) && ninpo.kind !== "装备") : COMMON_NINPO.slice(0, 2);
  const selectedDesignation = resolveDesignatedSkill(selectedNinpo, selected?.ninpoSkills ?? {});
  const selectedNinpoChoices = designatedSkillChoices(selectedNinpo);
  // 失去生命力分野的特技与被「麻痹」封锁的特技都不能用于判定或代用（与 BCDice 调色板同一口径）
  const paralyzedSkills = useMemo(() => selected?.paralyzedSkills ?? [], [selected]);
  const availableSkills = useMemo(
    () => (selected ? usableSkills(selected.skills, selected.life, paralyzedSkills) : []),
    [paralyzedSkills, selected],
  );
  // 【木莲】上下连通、【魔界工学】左右连通由已习得忍法推出
  const tableOptions = useMemo(() => (selected ? skillTableOptions(selected, allNinpo) : {}), [allNinpo, selected]);
  const legacyParalysis = Boolean(selected?.conditions.includes("麻痹")) && !paralyzedSkills.length;
  const automaticCheck = nearestSkill(availableSkills, targetSkill, tableOptions);
  const check = substituteSkillChoice === "auto"
    ? automaticCheck
    : substituteSkill(availableSkills, targetSkill, substituteSkillChoice, tableOptions);
  const selectedSpecialty = selected ? factionSpecialty(selected.faction) : null;
  const specialtyGapsMatch = !selectedSpecialty || !selected || matchesSpecialtyGaps(selected, selectedSpecialty);
  const battleOrder = useMemo(
    () => actionOrder(characters.filter((character) => character.active)),
    [characters],
  );
  const currentActor = battleOrder.length ? battleOrder[turnIndex % battleOrder.length] : null;
  const inAttackWindow = view === "battle" && revealed;
  const fumbleLine = checkFumbleLine({ inAttackWindow, plot: selected?.plot, supportCost: inAttackWindow ? 0 : supportCostInput });
  // 逆止中的行为判定自动失败；奥义或写明可在逆止中使用的忍法由判定面板复选框豁免。
  // 逆止只可能在战斗的「攻击处理～回合结束」产生并在新回合解除，战斗外残留的逆止标签视为过期、不影响判定
  const hasReversalTag = Boolean(selected?.conditions.includes("逆止"));
  const inReversal = hasReversalTag && inAttackWindow;
  const staleReversal = hasReversalTag && !inAttackWindow;
  const reversedCheck = inReversal && !reversalExempt;
  const odds = useMemo(
    () => calculateCheckOdds(diceCount, check.target, modifier, 12, fumbleLine, check.criticalOnly, reversedCheck),
    [check.criticalOnly, check.target, diceCount, modifier, fumbleLine, reversedCheck],
  );
  const importPreview = useMemo(() => parseCharacterText(importText), [importText]);
  const filteredTranscript = useMemo(() => {
    if (!transcript) return [];
    const query = transcriptQuery.trim().toLocaleLowerCase("zh-CN");
    return transcript.entries.filter((entry) => (
      (transcriptSceneId === "all" || entry.sceneId === transcriptSceneId)
      && (!transcriptSpeaker || entry.speaker === transcriptSpeaker)
      && (!query || `${entry.speaker} ${entry.text}`.toLocaleLowerCase("zh-CN").includes(query))
    )).slice(0, 800);
  }, [transcript, transcriptQuery, transcriptSceneId, transcriptSpeaker]);
  const dueCues = useMemo(
    () => cues.filter((cue) => !cue.done && (cue.cycle < cycle || (cue.cycle === cycle && cue.scene <= sceneNumber))),
    [cues, cycle, sceneNumber],
  );
  const gmBrief = createGmBrief({
    title: brief.title,
    cycle,
    sceneNumber,
    sceneOwnerId,
    sceneParticipantIds,
    sceneAction,
    characters,
    emotions,
    intel,
    trackers,
    cues,
    logs,
    beat: gmBeat,
    pressure: gmPressure,
    tableSafe,
  });
  const spotlightLedger = useMemo(
    () => calculateSpotlightLedger(characters, logs),
    [characters, logs],
  );
  const sceneCards = useMemo(
    () => generateSceneDeck({
      title: brief.title,
      cycle,
      sceneNumber,
      action: sceneAction,
      tension: gmBrief.tension,
      spotlightName: gmBrief.spotlight.name,
    }, sceneDeckNonce).map((card) => lockedSceneCards[card.kind] ?? card),
    [brief.title, cycle, gmBrief.spotlight.name, gmBrief.tension, lockedSceneCards, sceneAction, sceneDeckNonce, sceneNumber],
  );
  const preflightIssues = useMemo(
    () => evaluateSessionReadiness(characters, handouts, brief.playerCount, brief.requirements, allNinpo),
    [allNinpo, brief, characters, handouts],
  );
  const prepBlockers = preflightIssues.filter((issue) => issue.level === "blocker");
  const prepWarnings = preflightIssues.filter((issue) => issue.level === "warning");
  const resolutionActor = resolution ? characters.find((character) => character.id === resolution.actorId) : null;
  const resolutionTarget = resolution ? characters.find((character) => character.id === resolution.targetId) : null;
  const samePlotBatch = resolutionActor?.plot == null
    ? []
    : characters.filter((character) => character.active && character.plot === resolutionActor.plot);
  const smartHints = useMemo(() => buildSmartHints({
    characters,
    phase,
    prepBlockers,
    prepWarningCount: prepWarnings.length,
    sceneParticipantIds,
    sceneOwnerId,
    sceneAction,
    battleOrder,
    revealed,
    resolution,
    resolutionActorName: resolutionActor?.name,
    availableSkillCount: availableSkills.length,
    selected,
    dueCues,
    tableSafe,
  }), [availableSkills.length, battleOrder, characters, dueCues, phase, prepBlockers, prepWarnings.length, resolution, resolutionActor?.name, revealed, sceneAction, sceneOwnerId, sceneParticipantIds, selected, tableSafe]);

  return {
    selected, target, allNinpo, replayCast, requestedNinpo, firstActiveNinpo, activeNinpoId, selectedNinpo,
    learnedNinpo, selectedDesignation, selectedNinpoChoices, paralyzedSkills, availableSkills, tableOptions,
    legacyParalysis, automaticCheck, check, selectedSpecialty, specialtyGapsMatch, battleOrder, currentActor,
    inAttackWindow, fumbleLine, hasReversalTag, inReversal, staleReversal, reversedCheck, odds, importPreview,
    filteredTranscript, dueCues, gmBrief, spotlightLedger, sceneCards, preflightIssues, prepBlockers, prepWarnings,
    resolutionActor, resolutionTarget, samePlotBatch, smartHints,
  };
}

export type ConsoleDerived = ReturnType<typeof useConsoleDerived>;
