"use client";

import {
  CONDITIONS,
  checkFumbleLine,
  designatedSkillChoices,
  EMOTION_PAIRS,
  FIELD_NAMES,
  NO_SKILL,
  resolveDesignatedSkill,
  rollD6,
  SKILL_TABLE,
} from "../lib/rules";
import type { Ninpo } from "../lib/rules";
import { evasionSkill } from "../lib/session";
import type { Character, IntelKind, Phase, SceneAction, SessionBrief } from "../lib/session";
import type { ReplayEnding, ReplayGenre, ReplayLength, ReplayMode } from "../lib/replay";
import { createBCDicePalette } from "../lib/interop";
import { GM_BEATS } from "../lib/gm";
import type { GmPressure } from "../lib/gm";
import { listSceneCardDecks } from "../lib/director";
import type { SceneOracleLikelihood } from "../lib/director";
import TutorialRunner from "./tutorial/TutorialRunner";
import { DICE_MAIDEN_HINT, rollDiceCommand } from "../lib/dice";
import { LOCALES, t } from "../lib/i18n";
import { ACADEMY_LESSONS, GLOSSARY } from "../lib/academy";
import { ConsoleContext } from "./console/context";
import { useConsoleController } from "./console/useConsoleController";

const RANK_OPTIONS = ["下忍", "下忍头", "中忍", "中忍头", "上忍", "上忍头", "头领"];

/** 指定特技下拉：按分野分组，只列出候选特技。 */
function SkillOptions({ choices }: { choices: string[] }) {
  return <>{FIELD_NAMES.map((field) => {
    const skills = SKILL_TABLE[field].filter((skill) => choices.includes(skill));
    return skills.length ? <optgroup label={field} key={field}>{skills.map((skill) => <option value={skill} key={skill}>{skill}</option>)}</optgroup> : null;
  })}</>;
}

export default function ShinobigamiConsole() {
  const ctl = useConsoleController();
  const {
    academyDone, acceptGmSpotlight, acceptSuggestedAction, activeNinpoId, addBackgroundItem, addCharacter, addCue,
    addCustomNinpo, addEmotion, addLog, addTracker, addTreasure, advanceGmBeat, advanceTurn, allNinpo,
    appendGmDirection, appendOracleResult, appendSceneCard, appendSceneDeck, appendTranscriptEntry,
    applyCharacterImport, applyHandoutToCharacter, applySpecialtyGaps, attackOverride, automaticCheck,
    availableSkills, battleOrder, beginDefense, brief, changePhase, changeTutorial, characterLibrary,
    characterLibraryStatus, characters, check, checkpoint, clearParalysis, clearSession, completeScene,
    confirmResolutionEffects, copyBCDicePalette, copyCCFoliaCharacter, createReplay, cueCycle, cueScene, cueTitle,
    cues, currentActor, customCost, customKind, customName, customNinpo, customNote, customRange, customSkill,
    customSummary, cycle, declareNinpo, deleteCustomNinpo, diceCount, diceHint, diceInput, dismissResolution,
    downloadFoundryActor, dueCues, emotionFromId, emotionIndex, emotionPositive, emotionToId, emotions, exportReplay,
    exportSave, filteredTranscript, fumbleLine, gainIntel, gmBeat, gmBrief, gmPressure, handouts, history,
    importPortrait, importPreview, importRef, importSave, importText, importTranscriptFile, importWorkbookFile,
    inAttackWindow, inReversal, intel, intelKind, intelReceiverId, intelSubjectId, interopPrivate, lastRoll,
    learnedNinpo, legacyParalysis, loadCharacterFromLibrary, loadTranscript, locale, lockedSceneCards, logs,
    markEmotionUsed, modifier, newCycle, newRound, odds, openLessonId, oracleLikelihood, oracleQuestion,
    oracleResult, paralyzedSkills, phase, portraitRef, preflightIssues, prepBlockers, prepWarnings,
    removeBackgroundItem, removeCharacterFromLibrary, removeSelected, removeTreasure, replay, replayEnding,
    replayGenre, replayHeroId, replayIntensity, replayLength, replayMode, replayRevealSecrets, replaySeed,
    rerollReplay, rerollSceneCards, resizeHandouts, resolution, resolutionActor, resolutionTarget, revealPlots,
    revealed, reversalExempt, reversedCheck, rollCheck, rollEmotionTable, rollTableHint, round, runSceneOracle,
    samePlotBatch, saveSelectedToLibrary, sceneAction, sceneCards, sceneNote, sceneNumber, sceneOwnerId,
    sceneParticipantIds, selectCharacter, selected, selectedDesignation, selectedNinpo, selectedNinpoChoices,
    selectedSpecialty, sendReplayToDesk, setAttackOverride, setCueCycle, setCueScene, setCueTitle, setCustomCost,
    setCustomKind, setCustomName, setCustomNote, setCustomRange, setCustomSkill, setCustomSummary, setDiceCount,
    setDiceHint, setDiceInput, setEmotionFromId, setEmotionIndex, setEmotionPositive, setEmotionToId, setGmBeat,
    setGmPressure, setImportText, setIntelKind, setIntelReceiverId, setIntelSubjectId, setInteropPrivate, setLogs,
    setModifier, setNinpoSkill, setOpenLessonId, setOracleLikelihood, setOracleQuestion, setPlot, setReplayEnding,
    setReplayGenre, setReplayHeroId, setReplayIntensity, setReplayLength, setReplayMode, setReplayRevealSecrets,
    setReplaySeed, setReversalExempt, setSceneAction, setSceneNote, setSceneOwnerId, setSceneParticipantIds,
    setSelectedNinpoId, setSideView, setSubstituteSkillChoice, setSupportCostInput, setTableSafe, setTargetId,
    setTargetSkill, setTrackerMax, setTrackerName, setTranscript, setTranscriptDraft, setTranscriptQuery,
    setTranscriptSceneId, setTranscriptSpeaker, setTreasureName, setTreasureNote, setTreasureTargets, setTurnIndex,
    setView, setWorkbookImport, sideView, skipDefense, smartHints, specialtyGapsMatch, spotlightLedger,
    staleReversal, startSession, startTutorial, substituteSkillChoice, supportCostInput, switchLocale, tableOptions,
    tableSafe, target, targetSkill, toggleActive, toggleCondition, toggleCue, toggleGap, toggleLessonDone,
    toggleLife, toggleNinpo, toggleOuterGap, toggleSceneCardLock, toggleSceneParticipant, toggleSkill, trackerMax,
    trackerName, trackers, transcript, transcriptDraft, transcriptQuery, transcriptRef, transcriptSceneId,
    transcriptSpeaker, transferTreasure, treasureName, treasureNote, treasureTargets, treasures, turnIndex, tutorial,
    undo, updateBackgroundItem, updateBrief, updateCharacter, updateHandout, updateRequirements, updateTool,
    updateTracker, view, workbookImport, workbookImportStatus, workbookRef,
  } = ctl;

  if (!selected) return null;

  return (
    <ConsoleContext.Provider value={ctl}>
    <main className="console-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">忍</span>
          <div><p className="eyebrow">SHINOBIGAMI · SESSION CONSOLE</p><h1>忍神控制台</h1></div>
          <span className="version">MVP 1.8.0</span>
        </div>
        <div className="top-actions">
          <div className="round-badge"><span>ROUND</span><strong>{String(round).padStart(2, "0")}</strong></div>
          <button className="ghost-button" onClick={undo} disabled={!history.length}>{t("chrome.undo", locale)}</button>
          <button className="ghost-button" onClick={newRound}>{t("chrome.newRound", locale)}</button>
          <button className="primary-button" onClick={advanceTurn} disabled={!revealed}>{t("chrome.nextActor", locale)}</button>
        </div>
      </header>

      <nav className="mode-tabs" aria-label="主要视图">
        <button className={view === "academy" ? "active academy-tab" : "academy-tab"} onClick={() => setView("academy")}>{t("nav.academy", locale)}</button>
        <button className={view === "tutorial" ? "active first-mission-tab" : "first-mission-tab"} onClick={() => setView("tutorial")}>{t("nav.tutorial", locale)}</button>
        <button className={view === "prep" ? "active" : ""} onClick={() => setView("prep")}>{t("nav.prep", locale)}</button>
        <button className={view === "replay" ? "active replay-tab" : "replay-tab"} onClick={() => setView("replay")}>{t("nav.replay", locale)}</button>
        <button className={view === "battle" ? "active" : ""} onClick={() => setView("battle")}>{t("nav.battle", locale)}</button>
        <button className={view === "director" ? "active" : ""} onClick={() => setView("director")}>{t("nav.director", locale)}</button>
        <button className={view === "sheet" ? "active" : ""} onClick={() => setView("sheet")}>{t("nav.sheet", locale)}</button>
        <div className="phase-tabs" aria-label="团务阶段">
          {(["导入", "主要", "高潮"] as Phase[]).map((item, index) => <button key={item} className={phase === item ? "active" : ""} onClick={() => changePhase(item)}>{t(["phase.intro", "phase.main", "phase.climax"][index], locale)}</button>)}
        </div>
        <div className="save-actions">
          <div className="locale-switch" role="group" aria-label={t("chrome.language", locale)}>{LOCALES.map((item) => <button key={item.id} className={locale === item.id ? "active" : ""} onClick={() => switchLocale(item.id)}>{item.label}</button>)}</div>
          <button className={tableSafe ? "safe-active" : ""} onClick={() => setTableSafe((value) => !value)}>{tableSafe ? t("chrome.tableSafe", locale) : t("chrome.gmView", locale)}</button>
          <button onClick={exportSave}>{t("chrome.export", locale)}</button><button onClick={() => importRef.current?.click()}>{t("chrome.import", locale)}</button>
          <input ref={importRef} type="file" accept="application/json" onChange={importSave} hidden />
        </div>
      </nav>

      <div className={`workspace ${view === "tutorial" || view === "academy" ? "tutorial-workspace" : ""}`}>
        {view !== "tutorial" && view !== "academy" && <aside className="character-rail panel">
          <div className="panel-heading"><div><span>CHARACTERS</span><h2>登场角色</h2></div><span className="counter">{characters.length}</span></div>
          <div className="character-list">
            {characters.map((character) => {
              const remaining = FIELD_NAMES.filter((field) => character.life[field]).length + character.extraLife;
              return (
                <button key={character.id} className={`character-card ${selected.id === character.id ? "selected" : ""} ${currentActor?.id === character.id && revealed ? "current-turn" : ""} ${character.active ? "" : "inactive"}`} onClick={() => selectCharacter(character.id)}>
                  <span className={`role-chip ${character.role.toLowerCase()}`}>{character.role}</span>
                  <span className="character-name">{character.name}</span>
                  <span className="character-meta">{character.faction} · {character.rank}{!character.active ? " · 已脱落" : phase === "主要" ? ` · ${character.acted ? "已行动" : "未行动"}` : ""}</span>
                  <span className="life-dots" aria-label={`剩余生命力 ${remaining}`}>{FIELD_NAMES.map((field) => <i key={field} className={character.life[field] ? "alive" : "lost"} />)}</span>
                  <span className={`plot-token ${revealed ? "revealed" : ""}`}>{character.plot == null ? "–" : revealed ? character.plot : "?"}</span>
                </button>
              );
            })}
          </div>
          <div className="rail-actions"><button onClick={() => addCharacter("PC")}>＋ PC</button><button onClick={() => addCharacter("NPC")}>＋ NPC</button></div>
          <button className="danger-link" onClick={removeSelected} disabled={characters.length <= 1}>移除当前角色</button>
        </aside>}

        <section className="main-stage">
          {view === "academy" ? (
            <section className="panel academy-panel">
              <div className="panel-heading"><div><span>{t("academy.kicker", locale)}</span><h2>{t("academy.title", locale)}</h2></div><span className="selection-count">{t("academy.progress", locale)} {academyDone.length}/{ACADEMY_LESSONS.length}</span></div>
              <p className="academy-subtitle">{t("academy.subtitle", locale)}</p>
              <div className="academy-welcome">
                <h3>{t("welcome.title", locale)}</h3>
                <ul>
                  <li>{t("welcome.pathAcademy", locale)}</li>
                  <li><button className="inline-link" onClick={() => setView("tutorial")}>{t("welcome.pathTutorial", locale)}</button></li>
                  <li><button className="inline-link" onClick={() => setView("prep")}>{t("welcome.pathPro", locale)}</button></li>
                </ul>
              </div>
              <div className="academy-lessons">
                {ACADEMY_LESSONS.map((lesson, index) => {
                  const open = openLessonId === lesson.id;
                  const done = academyDone.includes(lesson.id);
                  return (
                    <article key={lesson.id} className={`academy-lesson ${done ? "done" : ""} ${open ? "open" : ""}`}>
                      <button className="academy-lesson-head" onClick={() => setOpenLessonId(open ? "" : lesson.id)}>
                        <span className="lesson-no">{String(index + 1).padStart(2, "0")}</span>
                        <span className="lesson-title">{lesson.title[locale]}</span>
                        <span className="lesson-meta">{done ? `✓ ${t("academy.done", locale)}` : `${lesson.minutes} min`}</span>
                      </button>
                      {open ? <div className="academy-lesson-body">
                        <p className="lesson-goal">{lesson.goal[locale]}</p>
                        {lesson.body.map((paragraph, at) => <p key={at}>{paragraph[locale]}</p>)}
                        {lesson.points?.length ? <ul>{lesson.points.map((point, at) => <li key={at}>{point[locale]}</li>)}</ul> : null}
                        <div className="lesson-actions">
                          {lesson.tryIt ? <button className="primary-button" onClick={() => setView(lesson.tryIt!.view)}>{lesson.tryIt.label[locale]}</button> : null}
                          <button className="ghost-button" onClick={() => toggleLessonDone(lesson.id)}>{done ? t("academy.markUndone", locale) : t("academy.markDone", locale)}</button>
                        </div>
                      </div> : null}
                    </article>
                  );
                })}
              </div>
              <div className="academy-glossary">
                <h3>{t("academy.glossary", locale)}</h3>
                <p>{t("academy.glossaryNote", locale)}</p>
                <div className="glossary-table" role="table">
                  <div className="glossary-row glossary-head" role="row"><span>中文</span><span>English</span><span>日本語</span></div>
                  {GLOSSARY.map((entry) => <div className="glossary-row" role="row" key={entry.zh}><span>{entry.zh}</span><span>{entry.en}</span><span>{entry.ja}</span></div>)}
                </div>
              </div>
            </section>
          ) : view === "tutorial" ? (
            <TutorialRunner
              state={tutorial}
              tableSafe={tableSafe}
              onChange={changeTutorial}
              onStart={startTutorial}
              onToggleTableSafe={() => setTableSafe((value) => !value)}
              onOpenConsole={(nextView) => setView(nextView)}
            />
          ) : view === "prep" ? (
            <>
              <section className="panel prep-brief-panel">
                <div className="panel-heading battle-heading">
                  <div><span>SESSION PRE-FLIGHT</span><h2>开团公告与约束</h2></div>
                  <span className="selection-count">{prepBlockers.length ? `${prepBlockers.length} 项阻塞` : "可以开团"}</span>
                </div>
                <div className="source-audit">
                  <strong>本地资料体检</strong>
                  <p>本工具不读取、不上传本机的规则书、字幕或其他本地文件；所有导入内容只在当前浏览器内解析，团务数据默认只存在本地存档中。</p>
                </div>
                <div className="brief-grid">
                  <label className="brief-title">忍务名称<input value={brief.title} onChange={(event) => updateBrief({ title: event.target.value })} /></label>
                  <label>规制<input value={brief.regulation} onChange={(event) => updateBrief({ regulation: event.target.value })} /></label>
                  <label>剧本类型<input value={brief.scenarioType} onChange={(event) => updateBrief({ scenarioType: event.target.value })} /></label>
                  <label>玩家人数<input type="number" min="1" max="12" value={brief.playerCount} onChange={(event) => updateBrief({ playerCount: Math.max(1, Number(event.target.value) || 1) })} /></label>
                  <label>巡数<input type="number" min="1" max="20" value={brief.cycles} onChange={(event) => updateBrief({ cycles: Math.max(1, Number(event.target.value) || 1) })} /></label>
                  <label>阶级<input value={brief.rank} onChange={(event) => updateBrief({ rank: event.target.value })} /></label>
                  <label>角色卡<select value={brief.characterMode} onChange={(event) => updateBrief({ characterMode: event.target.value as SessionBrief["characterMode"] })}><option>新卡</option><option>续卡</option><option>混合</option></select></label>
                  <label>GM 难度<input value={brief.gmDifficulty} onChange={(event) => updateBrief({ gmDifficulty: event.target.value })} /></label>
                  <label>交卡期限<input type="datetime-local" value={brief.submissionDeadline} onChange={(event) => updateBrief({ submissionDeadline: event.target.value })} /></label>
                  <label className="brief-rules">允许规则与扩展<textarea value={brief.allowedRules} onChange={(event) => updateBrief({ allowedRules: event.target.value })} placeholder="记录本团可用的扩展、下位流派或特殊规则；不要粘贴规则书原文。" /></label>
                </div>
                <div className="quota-strip">
                  <span>角色卡检查值</span>
                  <label>特技<input type="number" min="0" max="30" value={brief.requirements.requiredSkills} onChange={(event) => updateRequirements({ requiredSkills: Number(event.target.value) })} /></label>
                  <label>忍法槽<input type="number" min="0" max="30" value={brief.requirements.requiredNinpoSlots} onChange={(event) => updateRequirements({ requiredNinpoSlots: Number(event.target.value) })} /></label>
                  <label>忍具<input type="number" min="0" max="30" value={brief.requirements.requiredTools} onChange={(event) => updateRequirements({ requiredTools: Number(event.target.value) })} /></label>
                  <button onClick={resizeHandouts}>按人数整理 PC 位</button>
                  <em>接近战攻击为基础忍法，不计入忍法槽；扩展规则可直接调整检查值。</em>
                </div>
              </section>

              <section className="panel handout-panel">
                <div className="panel-heading battle-heading"><div><span>PRIVATE HANDOUTS</span><h2>PC 分配与秘密交付</h2></div><span className="selection-count">{handouts.length} 份</span></div>
                <div className="handout-list">
                  {handouts.map((handout) => {
                    const assigned = characters.find((character) => character.id === handout.assignedCharacterId);
                    return <article key={handout.id} className="handout-card">
                      <div className="handout-head"><strong>{handout.slot}</strong><span>{assigned?.name ?? "未分配"}</span></div>
                      <div className="handout-fields">
                        <label>分配角色<select value={handout.assignedCharacterId} onChange={(event) => updateHandout(handout.id, { assignedCharacterId: event.target.value, delivered: false, reviewed: false, questionsResolved: false })}><option value="">尚未分配</option>{characters.filter((character) => character.role === "PC").map((character) => <option key={character.id} value={character.id}>{character.name} · {character.faction}</option>)}</select></label>
                        <label>推荐流派<input value={handout.recommendedFaction} onChange={(event) => updateHandout(handout.id, { recommendedFaction: event.target.value, reviewed: false })} placeholder="不限或指定流派" /></label>
                        <label>公开使命<textarea value={handout.publicMission} onChange={(event) => updateHandout(handout.id, { publicMission: event.target.value, reviewed: false })} /></label>
                        <label className={tableSafe ? "masked-field" : ""}>私人秘密<textarea value={tableSafe ? "桌面安全模式：秘密已隐藏" : handout.privateSecret} disabled={tableSafe} onChange={(event) => updateHandout(handout.id, { privateSecret: event.target.value, delivered: false, questionsResolved: false })} /></label>
                      </div>
                      <div className="handout-actions">
                        <button className={handout.delivered ? "done" : ""} onClick={() => { checkpoint(); updateHandout(handout.id, { delivered: !handout.delivered }); }}>{handout.delivered ? "✓ 秘密已送达" : "确认秘密送达"}</button>
                        <button className={handout.questionsResolved ? "done" : ""} onClick={() => { checkpoint(); updateHandout(handout.id, { questionsResolved: !handout.questionsResolved }); }}>{handout.questionsResolved ? "✓ 问题已答复" : "确认私聊答复"}</button>
                        <button className={handout.reviewed ? "done" : ""} onClick={() => { checkpoint(); updateHandout(handout.id, { reviewed: !handout.reviewed }); }}>{handout.reviewed ? "✓ GM 已复核" : "确认角色卡复核"}</button>
                        <button onClick={() => applyHandoutToCharacter(handout)}>同步到角色卡</button>
                      </div>
                    </article>;
                  })}
                </div>
              </section>

              <section className="panel readiness-panel">
                <div className="readiness-score"><span>READY CHECK</span><strong>{prepBlockers.length ? "未通过" : "通过"}</strong><p>{prepBlockers.length} 项阻塞 · {prepWarnings.length} 项提醒</p></div>
                <div className="readiness-issues">
                  {preflightIssues.length ? preflightIssues.map((issue, index) => {
                    const fixCharacter = issue.fix ? characters.find((character) => character.id === issue.characterId) : undefined;
                    const fixNinpo = issue.fix ? allNinpo.find((ninpo) => ninpo.id === issue.fix?.ninpoId) : undefined;
                    return <article className={issue.level} key={`${issue.code}-${issue.characterId ?? issue.handoutId ?? ""}-${index}`}><span>{issue.level === "blocker" ? "!" : "·"}</span><p>{issue.message}</p>{issue.fix && fixCharacter && fixNinpo && <button className="issue-fix" onClick={() => setNinpoSkill(fixCharacter, fixNinpo, issue.fix?.skill ?? "")}>一键指定《{issue.fix.skill}》</button>}</article>;
                  }) : <article className="ready"><span>✓</span><p>公告、秘密交付、私聊确认与角色卡复核均已完成。</p></article>}
                </div>
                <div className="readiness-launch"><p>数量提醒允许 GM 按扩展规则确认后继续；秘密、分配与复核缺失会阻止误开团。</p><button onClick={startSession} disabled={Boolean(prepBlockers.length)}>完成检查，进入主要阶段 →</button></div>
              </section>
            </>
          ) : view === "replay" ? (
            <div className="replay-workshop">
              <section className="panel replay-forge-panel">
                <div className="panel-heading battle-heading">
                  <div><span>AUTOMATIC REPLAY FORGE</span><h2>自动 Replay 工房</h2></div>
                  <span className="selection-count">本地生成 · 可复现</span>
                </div>
                <div className="replay-hero">
                  <div>
                    <span>DRAMATIC ARC</span>
                    <h3>把当前团务锻造成一条有呼吸的故事线</h3>
                    <p>引子建立悬念，调查累积压力，中段故意回落，再用秘密反转推向高潮。相同种子与设置会生成相同正文，方便 GM 复盘与改稿。</p>
                  </div>
                  <div className="replay-arc-mini" aria-label="示例张力曲线">
                    {[18, 35, 58, 43, 72, 89, 77, 100, 34].map((value, index) => <i key={index} style={{ height: `${value}%` }} />)}
                  </div>
                </div>
                <div className="replay-config-grid">
                  <label>生成模式<select value={replayMode} onChange={(event) => setReplayMode(event.target.value as ReplayMode)}>{(["戏剧节拍", "实战巡回"] as ReplayMode[]).map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label>主角<select value={replayHeroId} onChange={(event) => setReplayHeroId(event.target.value)}>{characters.filter((character) => character.role === "PC").map((character) => <option key={character.id} value={character.id}>{character.name} · {character.faction}</option>)}</select></label>
                  <label>故事类型<select value={replayGenre} onChange={(event) => setReplayGenre(event.target.value as ReplayGenre)}>{(["都市悬疑", "学园怪谈", "黑色谍战", "热血决战"] as ReplayGenre[]).map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label>篇幅<select value={replayLength} onChange={(event) => setReplayLength(event.target.value as ReplayLength)}>{(["短篇", "标准", "长篇"] as ReplayLength[]).map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label>结局<select value={replayEnding} onChange={(event) => setReplayEnding(event.target.value as ReplayEnding)}>{(["苦涩胜利", "破晓逆转", "开放悬念", "任务失败"] as ReplayEnding[]).map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="replay-seed">固定种子<input value={replaySeed} onChange={(event) => setReplaySeed(event.target.value)} placeholder="例如 tsuioku-01" /></label>
                  <div className="replay-intensity"><span>戏剧强度</span><div>{([1, 2, 3] as const).map((level) => <button key={level} className={replayIntensity === level ? "active" : ""} onClick={() => setReplayIntensity(level)}>{level === 1 ? "克制" : level === 2 ? "起伏" : "激烈"}</button>)}</div></div>
                </div>
                <div className="replay-secret-row">
                  <label className={tableSafe ? "disabled" : ""}><input type="checkbox" checked={replayRevealSecrets && !tableSafe} disabled={tableSafe} onChange={(event) => setReplayRevealSecrets(event.target.checked)} />允许草稿引用角色秘密</label>
                  <span>{tableSafe ? "桌面安全模式已锁定：不会写入秘密。" : "关闭时只生成秘密发生了作用的占位叙事。"}</span>
                  <button className="replay-generate" onClick={() => createReplay()}>生成跌宕 Replay →</button>
                </div>
              </section>

              {replay ? <>
                <section className="panel replay-curve-panel">
                  <div className="replay-result-heading">
                    <div><span>TENSION MAP</span><h2>张力曲线</h2><p>低谷不是断线：假胜利让观众喘息，随后用反转抬高风险。</p></div>
                    <div className="replay-stats"><span><b>{replay.stats.sceneCount}</b> 幕</span>{replay.stats.cycleCount ? <span><b>{replay.stats.cycleCount}</b> 巡</span> : null}<span><b>{replay.stats.lineCount}</b> 行</span><span><b>{replay.stats.rollCount}</b> 次判定</span><span><b>{replay.stats.peakTension}</b> 峰值</span></div>
                  </div>
                  <div className="replay-curve" aria-label="Replay 张力曲线">
                    {replay.scenes.map((scene) => <div key={scene.id} className={scene.beat === "高潮" ? "peak" : ""}><b>{scene.tension}</b><i style={{ height: `${scene.tension}%` }} /><span>{scene.sceneType ?? scene.beat}</span></div>)}
                  </div>
                  <div className="replay-result-actions"><button onClick={rerollReplay}>换种子重演</button><button onClick={exportReplay}>导出 TXT</button><button className="send-replay" onClick={sendReplayToDesk}>送入跑团记录台 →</button></div>
                </section>

                <section className="replay-scenes" aria-label="自动生成的 Replay 场景">
                  {replay.scenes.map((scene) => <article className={`panel replay-scene-card beat-${scene.beat}`} key={scene.id}>
                    <header><span>{scene.sceneType ? (scene.cycle ? `第${scene.cycle}巡 · ${scene.sceneType}场景` : `${scene.sceneType}场景`) : `${scene.phase} · ${scene.beat}`}</span><h3>{String(scene.index).padStart(2, "0")} / {scene.title}</h3><div><b>{scene.tension}</b><small>TENSION</small></div></header>
                    <div className="replay-lines">{scene.lines.map((line) => <p className={line.kind} key={line.id}><strong>{line.speaker}</strong><span>{tableSafe && line.kind === "reveal" ? "桌面安全模式：秘密揭示已隐藏。" : line.text}</span></p>)}</div>
                  </article>)}
                </section>
                <p className="replay-disclaimer">自动判定只服务于戏剧化草稿，不替代实团掷骰、规则效果或 GM 裁定。生成与导出均在当前设备完成。</p>
              </> : <section className="panel replay-empty"><span>01</span><div><strong>先选择主角与故事方向</strong><p>生成器会读取角色名、流派、使命、信念、特技、忍法与奥义；只有主动允许时才会引用秘密。</p></div><span>09</span></section>}
            </div>
          ) : view === "battle" ? (
            <>
              <section className="panel plot-panel">
                <div className="panel-heading battle-heading">
                  <div><span>SECRET PLOT</span><h2>布局阶段</h2></div>
                  <button className="reveal-button" onClick={revealPlots} disabled={!characters.some((c) => c.plot != null)}>{revealed ? "已公开" : "公开全部布局"}</button>
                </div>
                <div className="plot-lanes">
                  {characters.filter((c) => c.active).map((character) => (
                    <div className="plot-row" key={character.id}>
                      <button className="plot-character" onClick={() => selectCharacter(character.id)}>{character.name}</button>
                      <div className="plot-options" aria-label={`${character.name} 的布局`}>
                        {[1, 2, 3, 4, 5, 6].map((plot) => <button key={plot} className={character.plot === plot ? "chosen" : ""} onClick={() => setPlot(character, plot)} aria-label={`${character.name} 选择布局 ${plot}`}>{character.plot === plot && !revealed ? "◆" : plot}</button>)}
                        <button className={`plot-violation ${character.plot === 0 ? "chosen" : ""}`} onClick={() => setPlot(character, 0)} aria-label={`${character.name} 布局违规，布局值记为 0`} title="公开布局时违规（手下无骰、骰数超出或超出限制范围）：布局值为 0">违规→0</button>
                      </div>
                      <span className="risk-label">攻击处理大失败 ≤ {character.plot == null ? 2 : checkFumbleLine({ inAttackWindow: true, plot: character.plot })}{character.plot === 0 ? "（布局 0）" : ""}</span>
                    </div>
                  ))}
                </div>
                {revealed && <div className="initiative-strip"><span>行动顺序</span>{battleOrder.map((character, index) => <button className={turnIndex % battleOrder.length === index ? "current" : ""} key={character.id} onClick={() => { selectCharacter(character.id); setTurnIndex(index); }}><b>{index + 1}</b>{character.name}<em>{character.plot ?? "?"}</em></button>)}</div>}
              </section>

              <div className="battle-grid">
                <section className="panel action-panel">
                  <div className="panel-heading"><div><span>ACTION</span><h2>忍法宣言</h2></div></div>
                  <div className="actor-banner"><span>行动者</span><strong>{selected.name}</strong><small>布局 {selected.plot ?? "未定"} · 花费 {selected.spentCost ?? 0}/{selected.plot ?? "–"}</small></div>
                  <label className="field-label">使用忍法<select value={activeNinpoId} onChange={(event) => setSelectedNinpoId(event.target.value)}>{learnedNinpo.map((ninpo) => <option value={ninpo.id} key={ninpo.id}>{ninpo.name}</option>)}</select></label>
                  <div className="ninpo-card"><div className="ninpo-stats"><span>{selectedNinpo.kind}</span><span>距离 {selectedNinpo.range}</span><span>花费 {selectedNinpo.cost}</span><span className={selectedDesignation.needsChoice ? "skill-unset" : ""}>{selectedNinpoChoices.length ? (selectedDesignation.skill ? `${selectedNinpo.skill}→${selectedDesignation.skill}` : `${selectedNinpo.skill}：未指定`) : selectedDesignation.variable ? "可变（按判定面板）" : selectedNinpo.skill}</span></div><p>{selectedNinpo.summary}</p>{selectedNinpo.damage && <strong>{selectedNinpo.damage}</strong>}</div>
                  {selectedDesignation.needsChoice && <label className="field-label skill-unset">指定特技（按规则于习得时选定；如需更正请在忍法配置修改）<select value="" onChange={(event) => setNinpoSkill(selected, selectedNinpo, event.target.value)}><option value="" disabled>请选择【{selectedNinpo.name}】的指定特技</option><SkillOptions choices={selectedNinpoChoices} /></select></label>}
                  <label className="field-label">目标<select value={target?.id ?? ""} onChange={(event) => setTargetId(event.target.value)}>{characters.filter((character) => character.id !== selected.id && character.active).map((character) => <option value={character.id} key={character.id}>{character.name} · 布局 {character.plot ?? "?"}{character.plot === 0 ? "（布局 0：可无视距离）" : ""}</option>)}</select></label>
                  {selectedNinpo.kind === "攻击" && <label className="override-toggle"><input type="checkbox" checked={attackOverride} onChange={(event) => setAttackOverride(event.target.checked)} />GM 覆盖：允许非本人行动时或本回合再次宣言攻击（追加攻击等特例）</label>}
                  <button className="declare-button" onClick={declareNinpo} disabled={!target}>宣言忍法</button>
                </section>

                <section className="panel check-panel">
                  <div className="panel-heading"><div><span>2D6 CHECK</span><h2>行为判定</h2></div></div>
                  <div className="check-target">
                    <label>指定特技<select value={targetSkill} onChange={(event) => setTargetSkill(event.target.value)}>{FIELD_NAMES.map((field) => <optgroup label={field} key={field}>{SKILL_TABLE[field].map((skill) => <option value={skill} key={skill}>{skill}</option>)}</optgroup>)}</select></label>
                    <div className="target-number"><span>目标值</span><strong>{check.target}</strong></div>
                  </div>
                  <label className="field-label">使用特技
                    <select value={availableSkills.includes(substituteSkillChoice) ? substituteSkillChoice : "auto"} onChange={(event) => setSubstituteSkillChoice(event.target.value)}>
                      <option value="auto">自动选择最近：{automaticCheck.skill}</option>
                      {availableSkills.map((skill) => <option value={skill} key={skill}>{skill}{skill === automaticCheck.skill ? "（最近）" : "（主动远距代用）"}</option>)}
                    </select>
                  </label>
                  <p className="substitution">本次使用：<b>{check.skill}</b> <span>距离 {check.distance}{check.wrapped ? `（经${[tableOptions.wrapRows ? "木莲" : "", tableOptions.wrapFields ? "魔界工学" : ""].filter(Boolean).join("/")}连通）` : ""}</span>{check.criticalOnly && <em>无可用特技：仅大成功可成功</em>}</p>
                  {paralyzedSkills.length > 0 && <p className="substitution paralysis-note">{paralyzedSkills.includes(targetSkill) ? `《${targetSkill}》麻痹中，已剔除，按代用计算；` : ""}麻痹封锁 {paralyzedSkills.map((skill) => `《${skill}》`).join("")}，已从可用特技中剔除</p>}
                  {staleReversal && <p className="substitution">「逆止」标签残留在战斗之外：逆止只在攻击处理～回合结束之间有效，本次判定不受影响（可在变调栏手动清除）。</p>}
                  {inReversal && <label className="reversal-toggle"><input type="checkbox" checked={reversalExempt} onChange={(event) => setReversalExempt(event.target.checked)} />本判定可在逆止中进行（奥义／写明可用的忍法）</label>}
                  <div className="odds-panel">
                    <div><span>成功率</span><strong>{(odds.success * 100).toFixed(1)}%</strong>{reversedCheck && <em>逆止中：行为判定自动失败</em>}</div>
                    <div className="odds-bar"><i className="fumble" style={{ width: `${odds.fumble * 100}%` }} /><i className="success" style={{ width: `${odds.success * 100}%` }} /></div>
                    <p>大成功 {(odds.critical * 100).toFixed(1)}% · 大失败 {(odds.fumble * 100).toFixed(1)}% · 按当前骰池、修正与大失败值精确枚举</p>
                  </div>
                  <div className="dice-pool-control"><span>骰池</span>{[2, 3, 4, 5, 6].map((count) => <button key={count} className={diceCount === count ? "active" : ""} onClick={() => setDiceCount(count)}>{count}D</button>)}<em>多骰取高 2</em></div>
                  <div className="modifier-control"><button onClick={() => setModifier((value) => value - 1)}>−</button><span>修正 <strong>{modifier > 0 ? `+${modifier}` : modifier}</strong></span><button onClick={() => setModifier((value) => value + 1)}>＋</button></div>
                  {!inAttackWindow ? <div className="modifier-control"><button onClick={() => setSupportCostInput((value) => Math.max(0, value - 1))}>−</button><span>支援忍法花费 <strong>{supportCostInput}</strong>{supportCostInput ? `（大失败线 ${fumbleLine}）` : ""}</span><button onClick={() => setSupportCostInput((value) => Math.min(9, value + 1))}>＋</button></div> : null}
                  <button className="roll-button" onClick={rollCheck}><span>{diceCount > 2 ? `${diceCount}SG` : "2SG"} · BCDICE STYLE</span>{reversedCheck ? "逆止：自动失败" : "投掷判定"}</button>
                  {lastRoll && <div className={`roll-result ${lastRoll.result.includes("失败") ? "failed" : "passed"}`}><span>{lastRoll.dice.join(" · ")}{lastRoll.dice.length > 2 ? ` → ${lastRoll.kept.join("+")}` : ""}</span><strong>{lastRoll.total}</strong><em>{lastRoll.result}</em></div>}
                  <div className="dice-pool-control quick-tables"><span>快速表骰</span><button onClick={rollEmotionTable}>ET 感情表</button><button onClick={() => rollTableHint("FT", "大失败表")}>FT 出目</button><button onClick={() => rollTableHint("WT", "变调表")}>WT 出目</button><button onClick={() => addLog(`[1D6] 素点：${rollD6()}。`, "roll")}>1D6</button><em>ET 给出感情对；FT／WT 只给出目，效果请对照规则书</em></div>
                </section>
              </div>

              <section className={`panel resolution-panel ${resolution ? "active" : "idle"}`}>
                <div className="panel-heading battle-heading">
                  <div><span>ACTION PIPELINE</span><h2>当前结算流程</h2></div>
                  <span className="selection-count">{resolution?.stage ?? "等待宣言"}</span>
                </div>
                {resolution ? <>
                  <div className="resolution-summary">
                    <div><span>行动者</span><strong>{resolutionActor?.name ?? "?"}</strong></div>
                    <b>【{resolution.ninpoName}】</b>
                    <div><span>目标</span><strong>{resolutionTarget?.name ?? "?"}</strong></div>
                  </div>
                  <div className="resolution-steps">
                    {(["命中判定", "反应窗口", "回避判定", "效果结算", "完成"] as const).map((stage, index, stages) => {
                      const currentIndex = stages.indexOf(resolution.stage);
                      return <span key={stage} className={index < currentIndex ? "done" : index === currentIndex ? "current" : ""}><i>{index < currentIndex ? "✓" : index + 1}</i>{stage}</span>;
                    })}
                  </div>
                  <div className="resolution-instruction">
                    {resolution.stage === "命中判定" && <p>使用右侧行为判定完成命中判定；失败会直接结束，成功后先停在宣言窗口。</p>}
                    {resolution.stage === "反应窗口" && <p>先询问是否还有同一时机的忍法、奥义或修正宣言；确认无人继续宣言后，再进入回避或直接适用效果。</p>}
                    {resolution.stage === "回避判定" && <p>当前已切换到 {resolutionTarget?.name ?? "目标"}，{evasionSkill(resolution) ? `使用攻击忍法的指定特技《${evasionSkill(resolution)}》完成回避判定` : resolution.skill === NO_SKILL ? "该攻击忍法的指定特技为「无」：回避方式按忍法说明由 GM 裁定，需要判定时请在右侧手动选择特技" : "旧存档未记录攻击方的指定特技：请在右侧手动选择后完成回避判定"}；成功则结束，失败进入效果结算。</p>}
                    {resolution.stage === "效果结算" && <p>{samePlotBatch.length > 1 ? `布局 ${resolutionActor?.plot} 有 ${samePlotBatch.length} 人同速：先记录结果，待同速角色都完成攻击后再统一应用生命、逆止与变调。` : "使用下方生命力与变调按钮应用结果，再确认效果已结算。"}</p>}
                    {resolution.stage === "完成" && <p>本次忍法已完成。可以归档流程，或直接点击顶部“下一位”归档并推进行动顺序。</p>}
                  </div>
                  <div className="resolution-actions">
                    {resolution.stage === "反应窗口" && <>{resolution.ninpoKind === "攻击" && <button onClick={beginDefense}>宣言完毕，进入回避</button>}<button onClick={skipDefense}>{resolution.ninpoKind === "攻击" ? "目标不回避，进入效果" : "宣言完毕，进入效果"}</button></>}
                    {resolution.stage === "效果结算" && <button onClick={confirmResolutionEffects}>确认伤害与效果已处理</button>}
                    {resolution.stage === "完成" && <button onClick={dismissResolution}>归档本次结算</button>}
                    {resolution.stage !== "完成" && <button className="skip" onClick={dismissResolution}>GM 跳过剩余流程</button>}
                  </div>
                </> : <div className="resolution-empty"><strong>宣言忍法后自动启动</strong><p>控制台会依次锁定命中、同一时机宣言、回避、效果与完成状态；未完成前会阻止误点下一位或新回合。</p></div>}
              </section>

              <section className="panel treasure-panel">
                <div className="panel-heading battle-heading"><div><span>PRIZE</span><h2>秘宝</h2></div><span className="selection-count">{treasures.length ? `${treasures.length} 件` : "尚未登记"}</span></div>
                <div className="treasure-list">
                  {treasures.length ? treasures.map((treasure) => {
                    const holder = characters.find((character) => character.id === treasure.holderId);
                    const candidates = characters.filter((character) => character.id !== treasure.holderId);
                    const targetId = candidates.some((character) => character.id === treasureTargets[treasure.id]) ? treasureTargets[treasure.id] : candidates[0]?.id ?? "";
                    return <article key={treasure.id}>
                      <div className="treasure-info"><strong>〈{treasure.name}〉</strong><span>持有者：{holder?.name ?? "无人"}</span>{treasure.note && <em>{treasure.note}</em>}</div>
                      <div className="treasure-actions">
                        <label>让渡给<select aria-label={`秘宝 ${treasure.name} 的让渡目标`} value={targetId} onChange={(event) => setTreasureTargets((items) => ({ ...items, [treasure.id]: event.target.value }))}>{candidates.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select></label>
                        <button onClick={() => transferTreasure(treasure.id, targetId)} disabled={!targetId}>让渡</button>
                        <button className="remove-treasure" onClick={() => removeTreasure(treasure.id)}>删除</button>
                      </div>
                    </article>;
                  }) : <p className="empty-log">尚未登记秘宝。登记后可在战斗结算或剧情节点执行让渡，流向会写入团务记录。</p>}
                </div>
                <div className="treasure-form">
                  <input aria-label="秘宝名称" value={treasureName} onChange={(event) => setTreasureName(event.target.value)} placeholder="秘宝名称" />
                  <input aria-label="秘宝备注" value={treasureNote} onChange={(event) => setTreasureNote(event.target.value)} placeholder="备注：夺取条件或效果摘要（勿粘贴规则书原文）" />
                  <button onClick={addTreasure} disabled={!treasureName.trim()}>登记秘宝</button>
                </div>
              </section>
            </>
          ) : view === "director" ? (
            <>
              <section className="panel gm-cockpit">
                <div className="gm-cockpit-head">
                  <div>
                    <span>VETERAN GM CO-PILOT</span>
                    <h2>熟练 GM 导演席</h2>
                    <p>给画面、问玩家、讲清得失、让失败继续推动故事。</p>
                  </div>
                  <div className={`gm-tension tension-${gmBrief.tensionLabel}`} role="status" aria-label={`当前场景张力 ${gmBrief.tension}，${gmBrief.tensionLabel}`}>
                    <span>SCENE TENSION</span>
                    <strong>{gmBrief.tension}</strong>
                    <em>{gmBrief.tensionLabel}</em>
                    <i><b style={{ width: `${gmBrief.tension}%` }} /></i>
                  </div>
                </div>

                <div className="gm-diagnostics">
                  {gmBrief.diagnostics.map((item) => <article className={item.tone} key={item.label}><span>{item.label}</span><strong>{item.value}</strong></article>)}
                  <article className={dueCues.length ? "danger" : "good"}><span>主持事件</span><strong>{gmBrief.privateCue}</strong></article>
                </div>

                <div className="gm-beat-rail" aria-label="场景节拍">
                  {GM_BEATS.map((beat, index) => <button key={beat} aria-pressed={gmBeat === beat} className={gmBeat === beat ? "active" : GM_BEATS.indexOf(gmBeat) > index ? "done" : ""} onClick={() => setGmBeat(beat)}><i>{String(index + 1).padStart(2, "0")}</i><span>{beat}</span></button>)}
                </div>

                <div className="gm-cockpit-body">
                  <article className="gm-now-card">
                    <span>NOW / 现在做什么</span>
                    <h3>{gmBrief.headline}</h3>
                    <p>{gmBrief.objective}</p>
                    <div className="gm-spotlight">
                      <span>建议聚光灯</span>
                      <strong>{gmBrief.spotlight.name}</strong>
                      <p>{gmBrief.spotlight.reason}</p>
                      <button onClick={acceptGmSpotlight}>采用聚光灯建议</button>
                    </div>
                  </article>

                  <article className="gm-read-card">
                    <span>READ ALOUD / 可直接朗读</span>
                    <blockquote>{gmBrief.readAloud}</blockquote>
                    <div><button onClick={() => appendGmDirection("opening")}>加入开场</button><button onClick={() => appendGmDirection("question")}>加入提问</button></div>
                  </article>

                  <article className="gm-stakes-card">
                    <span>STAKES / 判定前公开</span>
                    <div className="success"><b>成功</b><p>{gmBrief.success}</p></div>
                    <div className="failure"><b>失败</b><p>{gmBrief.failure}</p></div>
                    <div className="complication"><b>建议剧情代价</b><p>{gmBrief.complication}</p></div>
                  </article>
                </div>

                <div className="gm-command-bar">
                  <div className="gm-pressure-control">
                    <span>环境压力 · {gmBrief.pressureLabel}</span>
                    <button aria-label="降低环境压力" onClick={() => setGmPressure((value) => Math.max(0, value - 1) as GmPressure)}>−</button>
                    <strong>{gmPressure}</strong>
                    <button aria-label="提高环境压力" onClick={() => setGmPressure((value) => Math.min(3, value + 1) as GmPressure)}>＋</button>
                  </div>
                  <p>{gmBrief.nextStep}</p>
                  {sceneAction === "未定" && <button className="gm-action-suggest" onClick={acceptSuggestedAction}>建议：{gmBrief.suggestedAction}</button>}
                  <button className="gm-fail-forward" onClick={() => appendGmDirection("failure")}>失败也前进</button>
                  {gmBeat === "余波" && <button onClick={() => appendGmDirection("aftermath")}>记录余波</button>}
                  <button className="gm-next-beat" onClick={advanceGmBeat} disabled={gmBeat === "余波"}>下一节拍 →</button>
                </div>
              </section>

              <section className="panel scene-table">
                <div className="scene-table-head">
                  <div>
                    <span>ACTIVE SCENE MODE</span>
                    <h2>场景牌桌</h2>
                    <p>把可见素材放上桌，锁住想保留的牌，再让玩家决定如何回应。</p>
                  </div>
                  <div className="scene-presets" aria-label="快速选择场景行动">
                    {(["情报判定", "感情判定", "回复判定", "战斗", "计划判定"] as SceneAction[]).map((action) => (
                      <button key={action} className={sceneAction === action ? "active" : ""} aria-pressed={sceneAction === action} onClick={() => setSceneAction(action)}>
                        {action.replace("判定", "")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="scene-table-body">
                  <div className="scene-deck-area">
                    <div className="scene-card-grid">
                      {sceneCards.map((card) => {
                        const locked = Boolean(lockedSceneCards[card.kind]);
                        return (
                          <article className={`scene-card kind-${card.kind} ${locked ? "locked" : ""}`} key={card.kind}>
                            <header>
                              <span>{card.kind}</span>
                              <button aria-label={`${locked ? "解锁" : "锁定"}${card.kind}牌`} aria-pressed={locked} onClick={() => toggleSceneCardLock(card)}>
                                {locked ? "已锁" : "锁定"}
                              </button>
                            </header>
                            <h3>{card.title}</h3>
                            <p>{card.body}</p>
                            <blockquote>{card.prompt}</blockquote>
                            <button className="scene-card-use" onClick={() => appendSceneCard(card)}>写入本场</button>
                          </article>
                        );
                      })}
                    </div>
                    <div className="scene-deck-actions">
                      <button onClick={rerollSceneCards}>重抽未锁定</button>
                      <button onClick={appendSceneDeck}>整组写入场景笔记</button>
                      <small>牌桌内容为原创主持灵感，不会改写判定、伤害、变调或秘密。</small>
                    </div>
                  </div>

                  <aside className="scene-oracle">
                    <header><span>SITUATION ORACLE</span><h3>局势神谕</h3></header>
                    <label>卡住时问一个可验证的问题<input value={oracleQuestion} onChange={(event) => setOracleQuestion(event.target.value)} placeholder="例如：目标是否仍在附近？" /></label>
                    <div className="oracle-likelihood" aria-label="发生倾向">
                      {(["不太可能", "五五开", "很可能"] as SceneOracleLikelihood[]).map((likelihood) => (
                        <button key={likelihood} className={oracleLikelihood === likelihood ? "active" : ""} aria-pressed={oracleLikelihood === likelihood} onClick={() => setOracleLikelihood(likelihood)}>{likelihood}</button>
                      ))}
                    </div>
                    <button className="oracle-roll" onClick={runSceneOracle}>询问局势 · 2D6</button>
                    {oracleResult ? (
                      <article className={`oracle-result ${oracleResult.tone}`} aria-live="polite">
                        <div><span>{oracleResult.dice[0]} ＋ {oracleResult.dice[1]}</span><strong>{oracleResult.label}</strong></div>
                        <p>{oracleResult.answer}</p>
                        <blockquote>{oracleResult.prompt}</blockquote>
                        {oracleResult.twist && <em>异变：{oracleResult.twist}</em>}
                        <button onClick={appendOracleResult}>写入本场</button>
                      </article>
                    ) : <p className="oracle-empty">选择倾向后掷骰。结果只回答局势方向，最终解释仍由 GM 与玩家共同完成。</p>}
                  </aside>
                </div>

                <div className="spotlight-ledger">
                  <div><span>SPOTLIGHT LEDGER</span><strong>镜头账本</strong><small>按已完成场景统计</small></div>
                  {spotlightLedger.map((entry) => (
                    <article key={entry.id}>
                      <header><b>{entry.name}</b><span>{entry.scenes} 场 · {entry.share}%</span></header>
                      <i><b style={{ width: `${entry.scenes ? Math.max(entry.share, 8) : 2}%` }} /></i>
                    </article>
                  ))}
                </div>
              </section>

              <div className="director-grid">
                <section className="panel scene-panel">
                  <div className="panel-heading battle-heading">
                    <div><span>SCENE DIRECTOR</span><h2>第 {cycle} 巡 · 第 {sceneNumber} 场</h2></div>
                    <button className="reveal-button" onClick={newCycle}>开始新巡</button>
                  </div>
                  <div className="scene-form">
                    <label>场景玩家<select value={sceneOwnerId} onChange={(event) => { setSceneOwnerId(event.target.value); setSceneParticipantIds((items) => items.includes(event.target.value) ? items : [...items, event.target.value]); }}>{characters.filter((character) => character.role === "PC").map((character) => <option key={character.id} value={character.id}>{character.name} · {character.acted ? "已行动" : "未行动"}</option>)}</select></label>
                    <label>主要行动<select value={sceneAction} onChange={(event) => setSceneAction(event.target.value as SceneAction)}>{(["未定", "回复判定", "情报判定", "感情判定", "战斗", "计划判定", "辅助判定"] as SceneAction[]).map((action) => <option key={action}>{action}</option>)}</select></label>
                  </div>
                  <div className="participant-picker"><span>登场人物</span>{characters.map((character) => <button key={character.id} className={sceneParticipantIds.includes(character.id) ? "active" : ""} onClick={() => toggleSceneParticipant(character.id)}>{character.name}</button>)}</div>
                  <label className={`scene-note ${tableSafe ? "masked-field" : ""}`}>场景摘要或判定结果<textarea value={tableSafe ? "桌面安全模式：主持摘要已隐藏" : sceneNote} disabled={tableSafe} onChange={(event) => setSceneNote(event.target.value)} placeholder="只记录推进所需的关键词；秘密内容可留在角色卡中。" /></label>
                  <button className="complete-scene" onClick={completeScene}>完成场景并轮到下一位</button>
                  <div className="acted-strip">{characters.filter((character) => character.role === "PC").map((character) => <span className={character.acted ? "done" : ""} key={character.id}>{character.acted ? "✓" : "○"} {character.name}</span>)}</div>
                </section>

                <section className="panel scenario-panel">
                  <div className="panel-heading"><div><span>SCENARIO CLOCKS</span><h2>事件与进度</h2></div></div>
                  <div className="tracker-list">{trackers.map((tracker) => <article key={tracker.id}><div><strong>{tracker.name}</strong><span>{tracker.value}/{tracker.max}</span></div><div className="tracker-bar"><i style={{ width: `${tracker.max ? (tracker.value / tracker.max) * 100 : 0}%` }} /></div><div className="tracker-buttons"><button onClick={() => updateTracker(tracker.id, -1)}>−</button><button onClick={() => updateTracker(tracker.id, 1)}>＋</button></div></article>)}</div>
                  <div className="inline-form tracker-form"><input value={trackerName} onChange={(event) => setTrackerName(event.target.value)} placeholder="新进度名称" /><input aria-label="进度上限" type="number" min="2" max="20" value={trackerMax} onChange={(event) => setTrackerMax(Number(event.target.value))} /><button onClick={addTracker}>添加</button></div>
                  <div className="cue-heading"><strong>主持事件</strong><span>到点自动提醒，不自动公开内容</span></div>
                  <div className="cue-list">{cues.length ? cues.slice().sort((a, b) => a.cycle - b.cycle || a.scene - b.scene).map((cue) => <button key={cue.id} className={`${cue.done ? "done" : ""} ${dueCues.some((item) => item.id === cue.id) ? "due" : ""}`} onClick={() => toggleCue(cue.id)}><span>C{cue.cycle}·S{cue.scene}</span><b>{tableSafe ? "主持事件已隐藏" : cue.title}</b><em>{cue.done ? "已处理" : "待处理"}</em></button>) : <p className="empty-log">还没有安排主持事件。</p>}</div>
                  <div className="cue-form"><input value={cueTitle} onChange={(event) => setCueTitle(event.target.value)} placeholder="例如：公开档案或检查条件" /><label>巡<input type="number" min="1" value={cueCycle} onChange={(event) => setCueCycle(Number(event.target.value))} /></label><label>场<input type="number" min="1" value={cueScene} onChange={(event) => setCueScene(Number(event.target.value))} /></label><button onClick={addCue}>安排</button></div>
                </section>
              </div>

              <section className="panel transcript-panel">
                <div className="panel-heading battle-heading">
                  <div><span>LOCAL REPLAY DESK</span><h2>跑团记录台</h2></div>
                  <span className="selection-count">{transcript ? `${transcript.scenes.length} 段 · ${transcript.entries.length} 行` : "尚未导入"}</span>
                </div>
                {!transcript ? <div className="transcript-empty">
                  <div><strong>把论坛 Log 或聊天记录变成可检索的场景索引</strong><p>识别「导入场景」「第×巡」「高潮阶段」与 &lt;角色名&gt; 对话；只在当前设备解析，不预置或上传模组正文与秘密。</p><button onClick={() => transcriptRef.current?.click()}>选择 UTF-8 文本</button></div>
                  <textarea value={transcriptDraft} onChange={(event) => setTranscriptDraft(event.target.value)} placeholder={"也可以直接粘贴记录……\n导入场景：召集\n<角色名> 台词"} />
                  <button className="parse-transcript" onClick={() => loadTranscript(transcriptDraft, "粘贴记录")} disabled={!transcriptDraft.trim()}>解析粘贴内容</button>
                  <input ref={transcriptRef} type="file" accept="text/plain,.log,.txt" onChange={importTranscriptFile} hidden />
                </div> : <>
                  <div className="transcript-toolbar">
                    <input aria-label="搜索跑团记录" value={transcriptQuery} onChange={(event) => setTranscriptQuery(event.target.value)} placeholder="搜索台词、判定或关键词" />
                    <select aria-label="筛选记录片段" value={transcriptSceneId} onChange={(event) => setTranscriptSceneId(event.target.value)}><option value="all">全部片段</option>{transcript.scenes.map((scene) => <option value={scene.id} key={scene.id}>{scene.title}（{scene.entryCount}）</option>)}</select>
                    <select aria-label="筛选发言者" value={transcriptSpeaker} onChange={(event) => setTranscriptSpeaker(event.target.value)}><option value="">全部发言者</option>{transcript.speakers.map((speaker) => <option value={speaker.name} key={speaker.name}>{speaker.name}（{speaker.count}）</option>)}</select>
                    <button onClick={() => transcriptRef.current?.click()}>换一份记录</button>
                    <button className="remove-transcript" onClick={() => setTranscript(null)}>移除</button>
                    <input ref={transcriptRef} type="file" accept="text/plain,.log,.txt" onChange={importTranscriptFile} hidden />
                  </div>
                  <div className={`transcript-list ${tableSafe ? "masked-transcript" : ""}`}>
                    {tableSafe ? <div className="transcript-mask"><strong>桌面安全模式</strong><span>跑团记录可能包含秘密，当前已整体遮盖。</span></div> : filteredTranscript.length ? filteredTranscript.map((entry) => <article className={entry.kind} key={entry.id}>
                      <span>{entry.line}</span><div>{entry.speaker && <b>{entry.speaker}</b>}<p>{entry.text}</p></div><button onClick={() => appendTranscriptEntry(entry)}>加入场景笔记</button>
                    </article>) : <p className="empty-log">没有符合筛选条件的记录。</p>}
                  </div>
                  <div className="transcript-foot"><span>{transcript.sourceName}</span><em>显示 {filteredTranscript.length} 条{transcript.truncated ? " · 超长记录已截取前 5000 条" : ""}</em></div>
                </>}
              </section>

              <section className="panel intel-panel">
                <div className="panel-heading battle-heading"><div><span>RELATIONSHIP & INTEL</span><h2>人物关系与情报流向</h2></div><span className="selection-count">共享不连锁</span></div>
                <div className="relationship-grid">
                  <div className="relation-builder">
                    <h3>建立定向感情</h3>
                    <div className="relation-form"><select value={emotionFromId} onChange={(event) => setEmotionFromId(event.target.value)}>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select><span>对</span><select value={emotionToId} onChange={(event) => setEmotionToId(event.target.value)}>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select><select value={emotionIndex} onChange={(event) => setEmotionIndex(Number(event.target.value))}>{EMOTION_PAIRS.map((pair, index) => <option key={pair.join("/")} value={index}>{pair[0]} / {pair[1]}</option>)}</select><select value={emotionPositive ? "positive" : "negative"} onChange={(event) => setEmotionPositive(event.target.value === "positive")}><option value="positive">正面</option><option value="negative">负面</option></select><button onClick={addEmotion}>逐向记录</button></div>
                    <small>感情判定成功后，场景玩家与同场目标各自掷 1D6，并分别决定正面或负面；请为两个方向各记录一次。</small>
                    <div className="emotion-list">{emotions.length ? emotions.map((emotion) => { const from = characters.find((character) => character.id === emotion.fromId)?.name; const to = characters.find((character) => character.id === emotion.toId)?.name; return <article key={emotion.id} className={emotion.positive ? "positive" : "negative"}><div><strong>{from}</strong><span>→</span><strong>{to}</strong><b>{emotion.label}</b></div><button className={emotion.used ? "used" : ""} onClick={() => markEmotionUsed(emotion.id)}>{emotion.used ? "本轮已修正" : `${emotion.positive ? "+1" : "−1"} 修正`}</button></article>; }) : <p className="empty-log">尚未建立感情。</p>}</div>
                  </div>
                  <div className="intel-builder">
                    <h3>直接获得情报</h3>
                    <div className="intel-form"><select value={intelReceiverId} onChange={(event) => setIntelReceiverId(event.target.value)}>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select><span>获得</span><select value={intelSubjectId} onChange={(event) => setIntelSubjectId(event.target.value)}>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select><select value={intelKind} onChange={(event) => setIntelKind(event.target.value as IntelKind)}><option>秘密</option><option>居所</option><option>奥义</option></select><button onClick={gainIntel}>结算共享</button></div>
                    <div className="intel-list">{intel.length ? intel.map((record) => { const subjectName = characters.find((character) => character.id === record.subjectId)?.name ?? "已移除角色"; return <article key={`${record.subjectId}-${record.kind}`}><strong>{subjectName} · {record.kind}</strong><div>{record.knownBy.map((id) => <span key={id}>{characters.find((character) => character.id === id)?.name ?? "?"}</span>)}</div></article>; }) : <p className="empty-log">尚未记录已知情报。</p>}</div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <section className="panel sheet-panel">
              <div className="panel-heading battle-heading"><div><span>CHARACTER WORKBENCH</span><h2>角色工作台</h2></div><span className="selection-count">{selected.faction} · {selected.rank} · {selected.skills.length} 特技</span></div>
              <div className="character-dossier">
                <div className="portrait-column">
                  <button className={`portrait-frame ${selected.portrait ? "has-image" : ""}`} onClick={() => portraitRef.current?.click()} style={selected.portrait ? { backgroundImage: `url(${selected.portrait})` } : undefined}>
                    {!selected.portrait && <><span>立绘</span><b>{selected.name.slice(0, 2)}</b><em>选择本地图片</em></>}
                  </button>
                  <input ref={portraitRef} type="file" accept="image/*" onChange={importPortrait} hidden />
                  {selected.portrait && <button className="remove-portrait" onClick={() => updateCharacter(selected.id, { portrait: "" })}>移除立绘</button>}
                  <div className="dossier-stamp"><span>{selected.role}</span><strong>{selected.belief || "信念未定"}</strong><em>功绩点 {selected.merit ?? 0}</em></div>
                </div>
                <div className="identity-grid expanded">
                  <label className="name-field">角色名<input value={selected.name} onChange={(event) => updateCharacter(selected.id, { name: event.target.value })} /></label>
                  <label>玩家<input value={selected.player ?? ""} onChange={(event) => updateCharacter(selected.id, { player: event.target.value })} /></label>
                  <label>流派<input value={selected.faction} onChange={(event) => updateCharacter(selected.id, { faction: event.target.value })} /></label>
                  <label>下位流派<input value={selected.subFaction ?? ""} onChange={(event) => updateCharacter(selected.id, { subFaction: event.target.value })} placeholder="如无可留空" /></label>
                  <label>阶级<select value={selected.rank} onChange={(event) => updateCharacter(selected.id, { rank: event.target.value })}><option value="草">草（NPC 用）</option>{RANK_OPTIONS.map((rank) => <option key={rank}>{rank}</option>)}{selected.rank && selected.rank !== "草" && !RANK_OPTIONS.includes(selected.rank) && <option value={selected.rank}>{selected.rank}（导入值）</option>}</select></label>
                  <label>习得条件<input value={selected.condition ?? ""} onChange={(event) => updateCharacter(selected.id, { condition: event.target.value })} placeholder="条件" /></label>
                  <label>流仪<input value={selected.style ?? ""} onChange={(event) => updateCharacter(selected.id, { style: event.target.value })} /></label>
                  <label>年龄<input value={selected.age ?? ""} onChange={(event) => updateCharacter(selected.id, { age: event.target.value })} /></label>
                  <label>性别<input value={selected.gender ?? ""} onChange={(event) => updateCharacter(selected.id, { gender: event.target.value })} /></label>
                  <label>表之颜<input value={selected.cover ?? ""} onChange={(event) => updateCharacter(selected.id, { cover: event.target.value })} /></label>
                  <label>信念<input value={selected.belief ?? ""} onChange={(event) => updateCharacter(selected.id, { belief: event.target.value })} /></label>
                  <label>仇敌<input value={selected.enemy ?? ""} onChange={(event) => updateCharacter(selected.id, { enemy: event.target.value })} /></label>
                  <label>功绩点<input type="number" value={selected.merit ?? 0} onChange={(event) => updateCharacter(selected.id, { merit: Number(event.target.value) })} /></label>
                  <label>类型<select value={selected.role} onChange={(event) => updateCharacter(selected.id, { role: event.target.value as Character["role"] })}><option>PC</option><option>NPC</option></select></label>
                </div>
              </div>
              <div className="narrative-grid expanded-narrative">
                <label>使命<textarea value={selected.mission} onChange={(event) => updateCharacter(selected.id, { mission: event.target.value })} /></label>
                <label className={tableSafe ? "masked-field" : ""}>秘密<textarea value={tableSafe ? "桌面安全模式：秘密已隐藏" : selected.secret} disabled={tableSafe} onChange={(event) => updateCharacter(selected.id, { secret: event.target.value })} /></label>
                <label>人物故事<textarea value={selected.story ?? ""} onChange={(event) => updateCharacter(selected.id, { story: event.target.value })} placeholder="外表、性格、经历与角色钩子" /></label>
                <label>背景<textarea value={selected.backgrounds ?? ""} onChange={(event) => updateCharacter(selected.id, { backgrounds: event.target.value })} placeholder="每行一个背景，可写类型与效果摘要" /></label>
              </div>
              <section className="background-sheet">
                <div className="subsection-heading"><div><span>BACKGROUND LIST</span><h3>背景清单</h3></div><small>结构化条目支持从纯文本角色卡自动识别</small></div>
                <div className="background-table" role="table" aria-label="背景清单">
                  <div className="background-table-head" role="row"><span>序号</span><span>名称</span><span>类别</span><span>功绩点</span><span>效果</span><span /></div>
                  {selected.backgroundItems.length ? selected.backgroundItems.map((item) => <div className="background-table-row" role="row" key={item.id}>
                    <input aria-label="背景序号" value={item.serial} onChange={(event) => updateBackgroundItem(item.id, { serial: event.target.value })} placeholder="序号" />
                    <input aria-label="背景名称" value={item.name} onChange={(event) => updateBackgroundItem(item.id, { name: event.target.value })} />
                    <input aria-label="背景类别" value={item.category} onChange={(event) => updateBackgroundItem(item.id, { category: event.target.value })} placeholder="长处／短处" />
                    <input aria-label="背景功绩点" type="number" value={item.points} onChange={(event) => updateBackgroundItem(item.id, { points: Number(event.target.value) || 0 })} />
                    <input aria-label="背景效果" value={item.effect} onChange={(event) => updateBackgroundItem(item.id, { effect: event.target.value })} placeholder="效果摘要（勿粘贴规则书原文）" />
                    <button aria-label={`删除背景 ${item.name}`} onClick={() => removeBackgroundItem(item.id)}>×</button>
                  </div>) : <p className="empty-log">还没有结构化背景；可手动添加，或粘贴角色卡文本自动识别背景清单行。</p>}
                </div>
                <div className="background-foot">
                  <button onClick={addBackgroundItem}>＋ 添加背景</button>
                  <em>功绩点小计：{selected.backgroundItems.reduce((sum, item) => sum + item.points, 0)}（长处为正、短处为负）</em>
                </div>
              </section>
              <div className="ougi-grid">
                <label>奥义名<input value={selected.ougi} onChange={(event) => updateCharacter(selected.id, { ougi: event.target.value })} /></label>
                <label>指定特技<input value={selected.ougiSkill ?? ""} onChange={(event) => updateCharacter(selected.id, { ougiSkill: event.target.value })} /></label>
                <label>效果<input value={selected.ougiEffect ?? ""} onChange={(event) => updateCharacter(selected.id, { ougiEffect: event.target.value })} /></label>
                <label>强化<input value={selected.ougiStrength ?? ""} onChange={(event) => updateCharacter(selected.id, { ougiStrength: event.target.value })} /></label>
                <label>弱点<input value={selected.ougiWeakness ?? ""} onChange={(event) => updateCharacter(selected.id, { ougiWeakness: event.target.value })} /></label>
              </div>
              <div className="gap-controls"><span>特技空隙</span><button className={selected.outerGapClosed ? "closed" : ""} onClick={toggleOuterGap} title="器术左侧的外空隙：仅【魔界工学】左右连通生效时计入">器术左侧（外） · {selected.outerGapClosed ? "已填" : "空白"}</button>{FIELD_NAMES.slice(0, -1).map((field, index) => <button key={field} className={selected.closedGaps?.[index] ? "closed" : ""} onClick={() => toggleGap(index)}>{field}/{FIELD_NAMES[index + 1]} · {selected.closedGaps?.[index] ? "已填" : "空白"}</button>)}<em>填黑的空隙只算 1 格；外空隙仅【魔界工学】生效时计入</em></div>
              <div className="gap-controls topology-row">
                <span className={`topology-badge ${tableOptions.wrapRows ? "on" : ""}`} title="习得【木莲】时，特技表最上一行与最下一行相邻">木莲：上下连通 {tableOptions.wrapRows ? "✓" : "–"}</span>
                <span className={`topology-badge ${tableOptions.wrapFields ? "on" : ""}`} title="习得【魔界工学】时，器术列与妖术列相邻">魔界工学：左右连通 {tableOptions.wrapFields ? "✓" : "–"}</span>
                {selectedSpecialty && !specialtyGapsMatch && <button className="specialty-gaps" onClick={applySpecialtyGaps} title="按流派得意分野覆盖当前空隙；长处背景可能改变空隙，以角色卡为准（可撤销）">按得意分野涂黑空隙（{selectedSpecialty}）</button>}
                {selectedSpecialty && specialtyGapsMatch && <em>空隙与得意分野「{selectedSpecialty}」一致</em>}
              </div>
              <div className="skill-matrix">
                {FIELD_NAMES.map((field) => <div className={`skill-column ${selected.life[field] ? "" : "disabled-field"}`} key={field}><button className="field-life" onClick={() => toggleLife(field)}><span>{field}</span><i>{selected.life[field] ? "●" : "×"}</i></button>{SKILL_TABLE[field].map((skill) => {
                  const sealed = paralyzedSkills.includes(skill);
                  return <button key={skill} className={[selected.skills.includes(skill) ? "learned" : "", sealed ? "paralyzed" : ""].filter(Boolean).join(" ")} title={sealed ? "麻痹中：此特技暂时不能使用（奥义的指定特技不受影响）" : undefined} onClick={() => toggleSkill(skill)}>{skill}</button>;
                })}</div>)}
              </div>
              <section className="text-importer">
                <div>
                  <span>SMART IMPORT</span><h3>Excel／纯文字角色卡导入</h3>
                  <p>可直接选择自动角色卡 .xlsx，也可粘贴「纯文字化」内容；文件只在当前设备解析，不会上传。</p>
                  <button className="workbook-import-button" onClick={() => workbookRef.current?.click()}>选择 Excel 角色卡</button>
                  <input ref={workbookRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={importWorkbookFile} hidden />
                  <small className="workbook-import-status">{workbookImportStatus}</small>
                </div>
                <textarea value={importText} onChange={(event) => { setImportText(event.target.value); setWorkbookImport(null); }} placeholder={"粘贴角色卡文本，例如：\n名前：角色名\n流派：鞍马神流\n階級：中忍\n使命：……\n特技：刀術、走法……"} />
                <div className="import-preview"><span>识别 {importPreview.recognized} 项</span><b>{importPreview.name ?? "未识别姓名"}</b><em>{importPreview.skills.length} 特技 · {importPreview.ninpoIds.length} 忍法</em>{workbookImport && <small>{workbookImport.sheetName} · {workbookImport.cellCount} 个有效单元格</small>}<button onClick={applyCharacterImport} disabled={!importPreview.recognized}>应用到当前角色</button></div>
              </section>
              <section className="character-library-panel">
                <div className="subsection-heading">
                  <div><span>DEVICE-LOCAL TEMPLATES</span><h3>本地角色库</h3></div>
                  <button className="library-save" onClick={saveSelectedToLibrary}>保存当前角色</button>
                </div>
                <p className="library-status">{characterLibraryStatus}</p>
                {characterLibrary.length ? <div className="character-library-grid">
                  {characterLibrary.map((entry) => <article key={entry.id}>
                    <div><span>{entry.character.role}</span><small>{entry.savedAt.slice(0, 10)}</small></div>
                    <h4>{entry.name}</h4>
                    <p>{entry.faction}{entry.character.subFaction ? `・${entry.character.subFaction}` : ""} · {entry.rank}</p>
                    <em>{entry.character.skills.length} 特技 · {entry.character.ninpoIds.length} 忍法</em>
                    <div><button onClick={() => loadCharacterFromLibrary(entry)}>作为 PC 加入</button><button className="library-remove" onClick={() => removeCharacterFromLibrary(entry)}>移除</button></div>
                  </article>)}
                </div> : <p className="empty-log library-empty">还没有保存的角色。完成一次导入或车卡后，点击“保存当前角色”。</p>}
              </section>
              <section className="interop-panel">
                <div className="subsection-heading">
                  <div><span>OPEN-SOURCE BRIDGES</span><h3>开源团务互通桥</h3></div>
                  <small>导出结构，不上传资料，也不内置外部项目代码或规则表正文</small>
                </div>
                <div className="interop-source-strip">
                  <a href="https://github.com/bcdice/BCDice" target="_blank" rel="noreferrer"><b>BCDice</b><span>BSD-3-Clause · nSG@s#f&gt;=x</span></a>
                  <a href="https://github.com/neotaso/CCFOLIA-Akyou" target="_blank" rel="noreferrer"><b>CCFOLIA Clipboard</b><span>MIT · character JSON</span></a>
                  <a href="https://github.com/ksx0330/FVTT-Shinobigami-System" target="_blank" rel="noreferrer"><b>Foundry VTT</b><span>MIT · Actor / Item schema</span></a>
                </div>
                <div className="interop-body">
                  <div className="interop-preview"><span>BCDice 调色板预览</span><pre>{createBCDicePalette(selected, allNinpo).split("\n").slice(0, 5).join("\n")}</pre></div>
                  <div className="interop-actions">
                    <label className={tableSafe ? "disabled" : ""}><input type="checkbox" checked={interopPrivate && !tableSafe} disabled={tableSafe} onChange={(event) => setInteropPrivate(event.target.checked)} />导出时包含秘密与奥义</label>
                    <p>{tableSafe ? "桌面安全模式已锁定：所有出口只含公开资料。" : interopPrivate ? "私人资料将进入 CCFOLIA 备忘与 Foundry Handout；请只交给对应玩家或 GM。" : "默认只导出公开资料；本地立绘不会嵌入 JSON。"}</p>
                    <div><button onClick={copyBCDicePalette}>复制 BCDice 调色板</button><button onClick={copyCCFoliaCharacter}>复制 CCFOLIA 角色</button><button className="foundry-export" onClick={downloadFoundryActor}>导出 Foundry Actor</button></div>
                  </div>
                </div>
              </section>
              <section className="equipped-ninpo-sheet">
                <div className="subsection-heading"><div><span>AUTOMATIC NINPO LIST</span><h3>已装备忍法清单</h3></div><small>效果仅保存你的摘要；完整规则仍以所用规则书为准</small></div>
                <div className="ninpo-table" role="table" aria-label="已装备忍法清单">
                  <div className="ninpo-table-head" role="row"><span>忍法</span><span>类型</span><span>指定特技</span><span>距离</span><span>花费</span><span>效果摘要</span></div>
                  {allNinpo.filter((ninpo) => selected.ninpoIds.includes(ninpo.id)).map((ninpo) => <div className="ninpo-table-row" role="row" key={ninpo.id}><strong>{ninpo.name}{(ninpo.serial || ninpo.school) && <small className="ninpo-origin">{[ninpo.serial, ninpo.school].filter(Boolean).join(" · ")}</small>}</strong><span>{ninpo.kind}</span><span>{(() => {
                    if (!designatedSkillChoices(ninpo).length) return ninpo.skill;
                    const resolved = resolveDesignatedSkill(ninpo, selected.ninpoSkills ?? {}).skill;
                    return resolved ? `${ninpo.skill}→${resolved}` : <em className="skill-unset">{ninpo.skill}：未指定</em>;
                  })()}</span><span>{ninpo.range >= 99 ? "无" : ninpo.range}</span><span>{ninpo.cost || "无"}</span><p>{ninpo.summary}{ninpo.note && <span className="ninpo-note">备忘：{ninpo.note}</span>}</p></div>)}
                </div>
              </section>
              <section className="ninpo-loadout">
                <div className="subsection-heading"><div><span>REPEATING LOADOUT</span><h3>忍法配置</h3></div><small>点击添加或移出当前角色</small></div>
                <div className="ninpo-library">{allNinpo.map((ninpo) => {
                  const equipped = selected.ninpoIds.includes(ninpo.id);
                  const choices = equipped ? designatedSkillChoices(ninpo) : [];
                  const chosen = choices.length ? resolveDesignatedSkill(ninpo, selected.ninpoSkills ?? {}).skill : null;
                  return <div className={equipped ? "equipped" : ""} key={ninpo.id}>
                    <button onClick={() => toggleNinpo(ninpo.id)}><b>{ninpo.name}</b><span>{ninpo.kind} · {ninpo.skill} · 距{ninpo.range >= 99 ? "无" : ninpo.range} · 费{ninpo.cost}</span></button>
                    {choices.length > 0 && <label className={`ninpo-skill-pick ${chosen ? "" : "skill-unset"}`}>指定特技<select aria-label={`${ninpo.name} 的指定特技`} value={chosen ?? ""} onChange={(event) => setNinpoSkill(selected, ninpo, event.target.value)}><option value="">未指定</option><SkillOptions choices={choices} /></select></label>}
                    {customNinpo.some((item) => item.id === ninpo.id) && <button className="remove-custom" aria-label={`删除自定义忍法 ${ninpo.name}`} onClick={() => deleteCustomNinpo(ninpo.id)}>×</button>}
                  </div>;
                })}</div>
                <div className="custom-ninpo-form">
                  <input aria-label="自定义忍法名" placeholder="自定义忍法名" value={customName} onChange={(event) => setCustomName(event.target.value)} />
                  <select aria-label="忍法类型" value={customKind} onChange={(event) => setCustomKind(event.target.value as Ninpo["kind"])}><option>攻击</option><option>支援</option><option>装备</option></select>
                  <select aria-label="指定特技" value={customSkill} onChange={(event) => setCustomSkill(event.target.value)}><option value="自由">自由（习得时指定）</option><option value="无">无（无需判定）</option>{FIELD_NAMES.map((field) => <optgroup label={field} key={field}>{SKILL_TABLE[field].map((skill) => <option key={skill}>{skill}</option>)}</optgroup>)}</select>
                  <label>距离<input type="number" min="0" max="99" value={customRange} onChange={(event) => setCustomRange(Number(event.target.value))} /></label>
                  <label>花费<input type="number" min="0" max="99" value={customCost} onChange={(event) => setCustomCost(Number(event.target.value))} /></label>
                  <input className="custom-summary" aria-label="自定义忍法效果摘要" placeholder="效果摘要（请勿粘贴整段规则书原文）" value={customSummary} onChange={(event) => setCustomSummary(event.target.value)} />
                  <input className="custom-note" aria-label="自定义忍法备忘" placeholder="备忘（可选）" value={customNote} onChange={(event) => setCustomNote(event.target.value)} />
                  <button onClick={addCustomNinpo}>＋ 加入配置</button>
                </div>
              </section>
            </section>
          )}

          {view !== "tutorial" && <section className="panel status-panel">
            <div className="status-block life-block"><span className="mini-label">LIFE / 生命力</span><div className="field-toggles">{FIELD_NAMES.map((field) => <button key={field} className={selected.life[field] ? "healthy" : "lost"} onClick={() => toggleLife(field)}><i />{field}</button>)}</div><div className="extra-life"><span>追加生命力</span><button onClick={() => updateCharacter(selected.id, { extraLife: Math.max(0, selected.extraLife - 1) })}>−</button><strong>{selected.extraLife}</strong><button onClick={() => updateCharacter(selected.id, { extraLife: selected.extraLife + 1 })}>＋</button><button className={`active-toggle ${selected.active ? "" : "dropped"}`} onClick={toggleActive}>{selected.active ? "参战中" : "已脱落"}</button></div></div>
            <div className="status-block"><span className="mini-label">CONDITION / 变调·状态</span><div className="condition-list">{CONDITIONS.map((condition) => condition === "麻痹"
              ? <button key={condition} className={selected.conditions.includes(condition) ? "active" : ""} onClick={() => toggleCondition(condition)} title="点击追加一层：随机封锁 1 个尚未被封的已习得特技">{paralyzedSkills.length ? `麻痹×${paralyzedSkills.length}` : condition}</button>
              : <button key={condition} className={selected.conditions.includes(condition) ? "active" : ""} onClick={() => toggleCondition(condition)}>{condition}</button>)}
              {selected.conditions.includes("麻痹") && <button className="condition-clear" onClick={clearParalysis}>全部解除（身体操术判定成功）</button>}
            </div>
            {paralyzedSkills.length > 0 && <p className="paralysis-note">麻痹封锁：{paralyzedSkills.map((skill) => `《${skill}》`).join("")}（奥义的指定特技不受影响）</p>}
            {legacyParalysis && <p className="paralysis-note warn">旧存档未记录被封特技，请补抽：点「麻痹」随机封锁一层，或点「全部解除」。</p>}</div>
            <div className="status-block"><span className="mini-label">TOOLS / 忍具</span><div className="tool-list">{(Object.keys(selected.tools) as Array<keyof Character["tools"]>).map((tool) => <div key={tool}><span>{tool}</span><button onClick={() => updateTool(tool, -1)}>−</button><b>{selected.tools[tool]}</b><button onClick={() => updateTool(tool, 1)}>＋</button></div>)}</div></div>
          </section>}
        </section>

        {view !== "tutorial" && <aside className="log-panel panel">
          <div className="side-tabs"><button className={sideView === "assistant" ? "active" : ""} onClick={() => setSideView("assistant")}>智能提示</button><button className={sideView === "log" ? "active" : ""} onClick={() => setSideView("log")}>团务记录</button><button className={sideView === "rules" ? "active" : ""} onClick={() => setSideView("rules")}>规则速查</button></div>
          {sideView === "assistant" ? <div className="assistant-view">
            <div className="panel-heading"><div><span>RULE-AWARE ASSISTANT</span><h2>当前状态检查</h2></div><span className="counter">{smartHints.length}</span></div>
            <div className="hint-list">{smartHints.map((hint, index) => <article className={hint.tone} key={`${hint.title}-${index}`}><span>{hint.tone === "good" ? "✓" : hint.tone === "danger" ? "!" : "·"}</span><div><h3>{hint.title}</h3><p>{hint.detail}</p></div></article>)}</div>
            <div className="assistant-summary"><span>当前位置</span><strong>{phase === "导入" ? "开团检查" : phase === "主要" ? `第 ${cycle} 巡 · 第 ${sceneNumber} 场` : `第 ${round} 回合`}</strong><p>提示由当前状态和规则条件生成，不会替 GM 作剧情裁定。</p></div>
          </div> : sideView === "log" ? <>
            <div className="panel-heading"><div><span>SESSION LOG</span><h2>{phase}阶段 · {phase === "主要" ? `第 ${cycle} 巡` : `第 ${round} 回合`}</h2></div><button className="clear-log" onClick={() => setLogs([])}>清空</button></div>
            <form className="dice-maiden" onSubmit={(event) => { event.preventDefault(); const outcome = rollDiceCommand(diceInput, Math.random, { name: selected?.name ?? "GM", date: new Date().toISOString().slice(0, 10), skillTable: SKILL_TABLE, decks: listSceneCardDecks() }); if (!outcome) { setDiceHint(diceInput.trim() ? `骰娘歪了歪头：这句没看懂。${DICE_MAIDEN_HINT}` : DICE_MAIDEN_HINT); return; } addLog(`[骰娘]${outcome.hidden ? "[暗骰]" : ""} ${outcome.text}${outcome.flavor ? `「${outcome.flavor}」` : ""}`, outcome.tone); setDiceInput(""); setDiceHint(""); }}>
              <input aria-label="骰娘指令" value={diceInput} onChange={(event) => setDiceInput(event.target.value)} placeholder="对骰娘说：2d6+3 · 3SG>=5 · rh 暗骰 · draw 地点 · jrrp · help" />
              <button type="submit">掷</button>
              {diceHint ? <p className="dice-maiden-hint">{diceHint}</p> : null}
            </form>
            <div className="log-list">{logs.length ? logs.slice().reverse().map((entry) => <article className={`log-entry ${entry.tone}`} key={entry.id}><span>{phase === "主要" ? `C${entry.cycle ?? cycle}` : `R${entry.round}`}</span><p>{tableSafe ? "桌面安全模式：记录内容已隐藏" : entry.text}</p></article>) : <p className="empty-log">还没有记录。</p>}</div>
          </> : <div className="rules-list">
            <article><span>01</span><div><h3>行为判定</h3><p>目标值＝5＋指定特技到所用已习得特技的格数。默认选择最近特技，玩家也可以主动选择更远的特技代用；目标值不封顶。</p></div></article>
            <article><span>02</span><div><h3>特殊骰点</h3><p>大成功与大失败只看修正前骰点。通常 12 为大成功、2 为大失败；战斗从攻击处理到回合结束，大失败值改为当前布局值并造成逆止。</p></div></article>
            <article><span>03</span><div><h3>布局与行动</h3><p>秘密选择 1–6 后同时公开，由高到低行动；高布局更快，但大失败风险也更高。公开时违规的布局记为 0：最后行动，大失败值为 2。</p></div></article>
            <article><span>04</span><div><h3>距离与花费</h3><p>双方布局差不得超过忍法距离，目标布局为 0 时无视距离；同回合忍法累计花费不得超过自己的布局值；攻击忍法只能在自己行动时宣言，一回合一次。</p></div></article>
            <article><span>05</span><div><h3>伤害</h3><p>接近战随机失去分野生命力；射击战由受伤者选择；集团战通常获得变调。</p></div></article>
            <article><span>06</span><div><h3>BCDice 风格</h3><p>本工具日志记录 SG 命令。额外骰池采用 nSG 的“投 n 颗、取高 2 颗”方式。</p></div></article>
            <article><span>07</span><div><h3>情报共享</h3><p>当你抱有感情的角色直接获得情报时，你自动获得同一情报；共享所得不会继续触发连锁共享。</p></div></article>
            <article><span>08</span><div><h3>巡与场景</h3><p>主要阶段每位 PC 每巡有一次主要行动。剧情场景从回复、情报、感情中择一；GM 还可按剧本设置计划判定。辅助判定是 GM 设置的简单行动，不消耗主要行动。</p></div></article>
            <article><span>09</span><div><h3>宣言窗口</h3><p>同一时机可能有多个效果时，先询问是否继续宣言；确认无人追加后再推进回避或效果，避免错过时机后回溯。</p></div></article>
            <article><span>10</span><div><h3>同速批次</h3><p>同一布局的攻击视为同时发生；先完成同速角色的攻击，再统一应用生命减少、逆止、变调与附带效果。</p></div></article>
          </div>}
          <div className="log-footer"><button onClick={clearSession}>重置示例团</button><p>本工具仅提供规则辅助，特殊效果以 GM 裁定为准。</p></div>
        </aside>}
      </div>
    </main>
    </ConsoleContext.Provider>
  );
}
