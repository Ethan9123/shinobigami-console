"use client";

import { useMemo, useState } from "react";
import { rollD6 } from "../../lib/rules";
import {
  advanceTutorial,
  chooseTutorialEnding,
  createRainZeroLineTutorialState,
  getTutorialStep,
  RAIN_ZERO_LINE,
  recordTutorialChoice,
  resolveTutorialCombatRound,
  rollTutorialCheck,
  setTutorialPaused,
} from "../../lib/tutorial";
import type { TutorialState } from "../../lib/tutorial";

type Props = {
  state: TutorialState;
  tableSafe: boolean;
  onChange: (next: TutorialState, eventText?: string) => void;
  onStart: (next: TutorialState) => void;
  onToggleTableSafe: () => void;
  onOpenConsole: (view: "prep" | "battle" | "sheet" | "director") => void;
};

const outcomeLabels = {
  success: "成功",
  failure: "失败",
  critical: "大成功",
  fumble: "大失败",
} as const;

const toneOptions = [
  { id: "gentle", title: "轻柔", detail: "降低惊吓与冲突描写，重点放在调查。" },
  { id: "balanced", title: "平衡", detail: "保留悬疑和动作，但不描写残酷细节。" },
  { id: "dramatic", title: "强烈", detail: "强化紧张感；安全按钮仍然随时有效。" },
] as const;

const endingOptions = [
  { id: "seal", title: "重新封存", detail: "先救出乘客，再让记忆安静下来。" },
  { id: "break", title: "打破白狐匣", detail: "结束零号线，也承担记忆散失的代价。" },
  { id: "carry", title: "亲自带走", detail: "不交给任何组织，由你看守它。" },
] as const;

function progressFor(state: TutorialState) {
  const total = RAIN_ZERO_LINE.steps.length;
  const done = state.completedStepIds.length;
  const current = state.stepId ? RAIN_ZERO_LINE.steps.findIndex((item) => item.id === state.stepId) + 1 : total;
  return { total, done, current: Math.max(1, current), percent: Math.round((done / total) * 100) };
}

function updateDraftChoice(state: TutorialState, key: string, value: string): TutorialState {
  return { ...state, choices: { ...state.choices, [key]: value } };
}

export default function TutorialRunner({ state, tableSafe, onChange, onStart, onToggleTableSafe, onOpenConsole }: Props) {
  const [secretVisible, setSecretVisible] = useState(false);
  const [combatPlot, setCombatPlot] = useState(3);
  const [attackId, setAttackId] = useState("shoot");
  const [combatErrors, setCombatErrors] = useState<string[]>([]);
  const step = getTutorialStep(state);
  const progress = progressFor(state);
  const hero = RAIN_ZERO_LINE.characters.find((item) => item.role === "hero")!;
  const ally = RAIN_ZERO_LINE.characters.find((item) => item.role === "ally")!;
  const enemy = RAIN_ZERO_LINE.characters.find((item) => item.role === "enemy")!;
  const ending = RAIN_ZERO_LINE.endings.find((item) => item.id === state.endingId);
  const currentPlan = RAIN_ZERO_LINE.enemyPlans.find((item) => item.round === state.combatRound + 1);
  const remainingMinutes = Math.max(2, Math.ceil(((RAIN_ZERO_LINE.steps.length - state.completedStepIds.length) / RAIN_ZERO_LINE.steps.length) * RAIN_ZERO_LINE.meta.estimatedMinutes));
  const combatSummaries = useMemo(
    () => Object.entries(state.choices).filter(([key]) => key.startsWith("combat-summary-")).sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value),
    [state.choices],
  );

  const continueStep = (eventText?: string) => onChange(advanceTutorial(state), eventText);
  const performCheck = (key: string, target: number, failFlag: string) => {
    const dice = [rollD6(), rollD6()];
    const next = rollTutorialCheck(state, key, dice, target, failFlag);
    const roll = next.lastRoll;
    onChange(next, roll ? `${step?.title ?? "教学判定"}：${roll.dice.join("＋")}＝${roll.total}，${outcomeLabels[roll.outcome]}。` : undefined);
  };

  const confirmSafety = () => {
    const next = recordTutorialChoice(state, "safety-confirmed", "confirmed");
    onChange(next, `安全约定已确认：${toneOptions.find((item) => item.id === state.safety.tone)?.title ?? "平衡"}基调。`);
  };

  const resolveCombat = () => {
    const result = resolveTutorialCombatRound(state, {
      plot: combatPlot,
      attackId,
      dice: [rollD6(), rollD6()],
      enemyDice: [rollD6(), rollD6()],
    });
    if (!result.valid) {
      setCombatErrors(result.errors);
      return;
    }
    setCombatErrors([]);
    const round = result.state.combatRound;
    const next = {
      ...result.state,
      choices: {
        ...result.state.choices,
        [`combat-plot-${round}`]: String(combatPlot),
        [`combat-summary-${round}`]: result.summary.join(" "),
      },
    };
    onChange(next, result.summary.join(" "));
  };

  const safetyAction = (action: "pause" | "fade" | "resume") => {
    if (action === "pause") {
      onChange(setTutorialPaused(state, true), "教学团已暂停。无需说明理由，准备好后再继续。");
      return;
    }
    if (action === "resume") {
      onChange(setTutorialPaused(state, false), "教学团继续。");
      return;
    }
    onChange(updateDraftChoice(state, "last-safety-action", "fade"), "当前内容已淡化并跳过细节。");
  };

  if (state.status === "off") {
    return (
      <section className="tutorial-landing panel">
        <div className="tutorial-hero-copy">
          <span className="tutorial-kicker">ORIGINAL SOLO TUTORIAL · 无需主持人</span>
          <h2>从零开始，跑完你的第一次忍务</h2>
          <p>{RAIN_ZERO_LINE.publicOpening}</p>
          <div className="tutorial-metrics">
            <span><b>1</b> 名玩家</span><span><b>{RAIN_ZERO_LINE.meta.estimatedMinutes}</b> 分钟</span><span><b>{RAIN_ZERO_LINE.meta.cycles}</b> 个循环</span><span><b>0</b> 规则预习</span>
          </div>
          <button className="tutorial-start" onClick={() => onStart(createRainZeroLineTutorialState())}>开始《{RAIN_ZERO_LINE.meta.title}》</button>
          <p className="tutorial-disclaimer">这是本项目原创的单人协力教学变体。系统扮演主持人与 NPC；规则结算可检查，剧情选择始终由你决定。</p>
        </div>
        <aside className="tutorial-promise">
          <span>这次会学到</span>
          {RAIN_ZERO_LINE.teachingPoints.map((point, index) => <article key={point}><b>{String(index + 1).padStart(2, "0")}</b><p>{point}</p></article>)}
          <div className="tutorial-source-note"><strong>设计边界</strong><p>只使用基本概念；不要求下位流派、背景或扩展规则。关键失败会推进剧情，这是本剧本的教学技术，不是官方通则。</p></div>
        </aside>
      </section>
    );
  }

  if (state.status === "complete") {
    return (
      <section className="tutorial-complete panel">
        <span className="tutorial-kicker">MISSION COMPLETE</span>
        <h2>第一次忍务，完成</h2>
        <p>{ending?.summary ?? "零号线的故事已经结束，而你的忍者生涯刚刚开始。"}</p>
        <div className="learned-grid">
          {RAIN_ZERO_LINE.teachingPoints.map((point) => <article key={point}><span>✓</span><p>{point}</p></article>)}
        </div>
        <div className="debrief-card"><div><span>星 · 最喜欢的瞬间</span><strong>{state.choices.star || "尚未填写"}</strong></div><div><span>愿 · 下次想尝试</span><strong>{state.choices.wish || "尚未填写"}</strong></div></div>
        <div className="tutorial-final-actions"><button onClick={() => onOpenConsole("director")}>进入完整导演台</button><button className="secondary" onClick={() => onStart(createRainZeroLineTutorialState())}>重新游玩</button></div>
      </section>
    );
  }

  if (!step) return null;

  const renderStepBody = () => {
    if (state.safety.paused) return <div className="tutorial-paused"><span>PAUSED</span><h3>游戏已经暂停</h3><p>不需要说明理由。准备好后，使用下方“继续游戏”恢复当前步骤。</p></div>;
    if (step.id === "welcome") return <>
      <div className="read-aloud"><span>照着读</span><p>{RAIN_ZERO_LINE.publicOpening}</p></div>
      <div className="scene-question"><span>你的第一个选择</span><h3>朝雾澄为什么愿意踏进这班不该存在的列车？</h3><textarea value={state.choices["opening-motive"] ?? ""} onChange={(event) => onChange(updateDraftChoice(state, "opening-motive", event.target.value))} placeholder="一句话就够，例如：师父失踪前也收到过同一张车票。" /></div>
      <button className="tutorial-primary" disabled={!state.choices["opening-motive"]?.trim()} onClick={() => continueStep("朝雾澄踏上零号线，忍务开始。")}>登上列车</button>
    </>;

    if (step.id === "safety") return <>
      <div className="rule-callout advice"><span>开团约定</span><p>任何时候都可以暂停、淡化或跳过当前内容，不需要解释理由。下面的设置只保存在这台设备。</p></div>
      <div className="tone-grid">{toneOptions.map((tone) => <button key={tone.id} className={state.safety.tone === tone.id ? "selected" : ""} onClick={() => onChange({ ...state, safety: { ...state.safety, tone: tone.id } })}><strong>{tone.title}</strong><span>{tone.detail}</span></button>)}</div>
      <div className="safety-fields"><label>不要出现<textarea value={state.safety.lines.join("\n")} onChange={(event) => onChange({ ...state, safety: { ...state.safety, lines: event.target.value.split("\n").filter(Boolean) } })} placeholder="每行一项；可以留空" /></label><label>只淡写、不细描<textarea value={state.safety.veils.join("\n")} onChange={(event) => onChange({ ...state, safety: { ...state.safety, veils: event.target.value.split("\n").filter(Boolean) } })} placeholder="每行一项；可以留空" /></label></div>
      <button className="tutorial-primary" onClick={confirmSafety}>确认边界并继续</button>
    </>;

    if (step.id === "mission") return <>
      <div className="mission-card"><span>公开使命</span><h3>{hero.character.name}</h3><p>{hero.character.mission}</p></div>
      <div className={`secret-envelope ${secretVisible && !tableSafe ? "open" : ""}`}><span>只给玩家看的秘密</span>{secretVisible && !tableSafe ? <p>{hero.character.secret}</p> : <p>秘密尚在信封中。投屏或共享屏幕时请保持桌面安全模式。</p>}<button onClick={() => tableSafe ? onToggleTableSafe() : setSecretVisible((value) => !value)}>{tableSafe ? "切回玩家私密视图" : secretVisible ? "收起秘密" : "打开秘密信封"}</button></div>
      <button className="tutorial-primary" disabled={!secretVisible || tableSafe} onClick={() => continueStep("使命与秘密已经交付。")}>我已读懂使命与秘密</button>
    </>;

    if (step.id === "sheet-tour") return <>
      <div className="character-tour">
        <div><span>生命</span><strong>6 个领域</strong><p>领域失去后，对应特技不能用于代用。教学战斗另用 4 格简化生命。</p></div>
        <div><span>已习得特技</span><strong>{hero.character.skills.length} 项</strong><p>{hero.character.skills.join("、")}</p></div>
        <div><span>忍具</span><strong>3 件</strong><p>兵粮丸 ×2、神通丸 ×1；其中一枚兵粮丸是新手保护。</p></div>
        <div><span>教学攻击</span><strong>{RAIN_ZERO_LINE.attacks.length} 种</strong><p>{RAIN_ZERO_LINE.attacks.map((item) => item.name).join("、")}</p></div>
      </div>
      <div className="rule-callout rule"><span>规则事实</span><p>普通判定投 2D6，达到目标值即成功。系统会替你算目标值，但会保留骰面和依据。</p></div>
      <button className="tutorial-primary" onClick={() => continueStep("角色卡导览完成。")}>我准备好了</button>
    </>;

    if (step.id === "cycle-1-open" || step.id === "cycle-2-open") {
      const first = step.id === "cycle-1-open";
      const key = first ? "cycle-1-action" : "cycle-2-action";
      return <>
        <div className="read-aloud"><span>场景开场</span><p>{step.gmPrompt}</p></div>
        <div className="scene-question"><span>描述行动，不需要术语</span><h3>{first ? "你怎么检查这节空车厢？" : "你怎样回应灯里递来的旧车票？"}</h3><textarea value={state.choices[key] ?? ""} onChange={(event) => onChange(updateDraftChoice(state, key, event.target.value))} placeholder={first ? "例如：我不碰倒影，先检查地板上脚印的方向。" : "例如：我接过车票，先问她最害怕想起什么。"} /></div>
        <div className="rule-callout advice"><span>剧情建议</span><p>{first ? "任何合理做法都可以；系统会把它映射为调查术判定。" : "安慰、追问或保持距离都有效，没有标准答案。"}</p></div>
        <button className="tutorial-primary" disabled={!state.choices[key]?.trim()} onClick={() => continueStep(first ? "第一循环场景已经建立。" : "第二循环场景已经建立。")}>让场景继续</button>
      </>;
    }

    if (step.id === "cycle-1-check" || step.id === "cycle-2-emotion") {
      const first = step.id === "cycle-1-check";
      const key = first ? "trace-carriage" : "trust-akari";
      const outcome = state.outcomes[key];
      return <>
        <div className="check-explainer"><div><span>指定特技</span><strong>{first ? "调查术" : "传达术"}</strong></div><div><span>目标值</span><strong>7</strong></div><div><span>骰池</span><strong>2D6</strong></div></div>
        <div className="rule-callout rule"><span>规则事实</span><p>两颗骰子相加，7 以上成功；12 是大成功，2 是大失败。本次没有额外修正。</p></div>
        <div className="rule-callout scenario"><span>剧本触发</span><p>即使失败，关键线索仍会出现，但局面会产生新的代价。这是本教学剧本的推进方式。</p></div>
        <button className="dice-button" onClick={() => performCheck(key, 7, first ? "conductor-alerted" : "akari-doubt")}><span>ROLL</span>投 2D6</button>
        {outcome && state.lastRoll?.key === key && <div className={`tutorial-roll ${outcome}`}><span>{state.lastRoll.dice.join(" ＋ ")}</span><strong>{state.lastRoll.total}</strong><em>{outcomeLabels[outcome]}</em></div>}
      </>;
    }

    if (step.id === "cycle-1-result") {
      const failed = ["failure", "fumble"].includes(state.outcomes["trace-carriage"]);
      return <>
        <div className="reveal-card"><span>获得线索</span><h3>白狐匣在列车前部，车顶还有第二条路。</h3><p>{failed ? "你找到湿脚印时，广播突然念出你的名字。车掌已经察觉搜索，高潮时会逼近得更快。" : "你避开了车掌的监视，并在座椅下找到一枚通往车顶的检修钥匙。"}</p></div>
        <div className="rule-callout scenario"><span>剧本触发</span><p>失败没有被改写成成功；你付出了代价，但故事不会因缺少关键线索而停住。</p></div>
        <button className="tutorial-primary" onClick={() => continueStep("第一循环结束：白狐匣的位置已经查明。")}>进入第二循环</button>
      </>;
    }

    if (step.id === "cycle-2-choice") return <>
      <div className="reveal-card"><span>灯里的真相</span><h3>{ally.character.secret}</h3><p>她没有要求你原谅或相信，只问了一句：“如果匣子记得所有人，我们有权替他们忘掉吗？”</p></div>
      <div className="choice-grid">
        <button onClick={() => onChange(recordTutorialChoice(state, "ally-response", "protect"), "你答应先保护乘客，再决定白狐匣的命运。")}>先保护乘客<span>我会听完所有人的声音。</span></button>
        <button onClick={() => onChange(recordTutorialChoice(state, "ally-response", "question"), "你决定保留怀疑，亲自查清白狐匣。")}>保留怀疑<span>我会查清真相，再作决定。</span></button>
        <button onClick={() => onChange(recordTutorialChoice(state, "ally-response", "orders"), "你提醒灯里，使命仍然优先。")}>使命优先<span>我们先夺回匣子。</span></button>
      </div>
    </>;

    if (step.id === "climax-intro") return <>
      <div className="read-aloud danger"><span>高潮开场</span><p>隧道吞没最后一盏站灯。无面车掌抱起白狐匣，推开通往车顶的门。雨像倒飞的针，列车终点只剩三回合。</p></div>
      <div className="enemy-card"><div><span>主要敌人</span><h3>{enemy.character.name}</h3></div><p>{enemy.overview}</p></div>
      <div className="rule-callout advice"><span>剧情建议</span><p>先说清目标：你不必杀死车掌；击碎面具，或坚持三回合，都能进入最后选择。</p></div>
      <button className="tutorial-primary" onClick={() => continueStep("高潮阶段开始。")}>追上车顶</button>
    </>;

    if (step.id === "climax-plot") return <>
      <div className="rule-callout rule"><span>规则事实</span><p>布局 1–6 决定行动先后、攻击距离与失手线。数字越高越快，但骰点不高于布局时会失手。</p></div>
      <div className="plot-picker">{[1, 2, 3, 4, 5, 6].map((plot) => <button key={plot} onClick={() => onChange(recordTutorialChoice(state, "climax-plot", String(plot)), `高潮首回合选择布局 ${plot}。`)}><b>{plot}</b><span>{plot <= 2 ? "稳健" : plot <= 4 ? "平衡" : "高速"}</span></button>)}</div>
      <p className="microcopy">教学提示：无面车掌首回合使用布局 3。选择 2–4 可以让两种攻击都在距离内。</p>
    </>;

    if (step.id === "climax-battle") return <>
      <div className="combat-hud"><div><span>{hero.character.name}</span><strong>{"●".repeat(state.heroLife)}{"○".repeat(Math.max(0, 4 - state.heroLife))}</strong></div><b>ROUND {state.combatRound + 1}/3</b><div><span>{enemy.character.name}</span><strong>{"●".repeat(state.enemyLife)}{"○".repeat(Math.max(0, 4 - state.enemyLife))}</strong></div></div>
      {currentPlan && <div className="enemy-intent"><span>教学用公开计划 · 剧本触发</span><strong>车掌将使用布局 {currentPlan.plot}</strong><p>{currentPlan.prompt}</p></div>}
      <div className="combat-controls"><div><span>1. 选择本回合布局</span><div className="compact-plots">{[1, 2, 3, 4, 5, 6].map((plot) => <button key={plot} className={combatPlot === plot ? "selected" : ""} onClick={() => setCombatPlot(plot)}>{plot}</button>)}</div></div><div><span>2. 选择攻击</span><div className="attack-grid">{RAIN_ZERO_LINE.attacks.map((attack) => <button key={attack.id} className={attackId === attack.id ? "selected" : ""} onClick={() => setAttackId(attack.id)}><strong>{attack.name}</strong><span>距离 {attack.range} · 目标值 {attack.target} · 伤害 {attack.damage}</span><p>{attack.description}</p></button>)}</div></div></div>
      {combatErrors.length > 0 && <div className="combat-errors">{combatErrors.map((error) => <p key={error}>{error}</p>)}</div>}
      <button className="dice-button" onClick={resolveCombat}><span>RESOLVE</span>结算双方行动</button>
      {combatSummaries.length > 0 && <div className="combat-log">{combatSummaries.map((summary, index) => <p key={`${summary}-${index}`}><b>R{index + 1}</b>{summary}</p>)}</div>}
    </>;

    if (step.id === "ending") return <>
      <div className="reveal-card"><span>最后的秘密</span><h3>{enemy.character.secret}</h3><p>面具裂开后，许多乘客的声音同时问你：“这些记忆应该属于谁？”</p></div>
      <div className="choice-grid endings">{endingOptions.map((option) => <button key={option.id} onClick={() => onChange(chooseTutorialEnding(state, option.id), `结局选择：${option.title}。`)}><strong>{option.title}</strong><span>{option.detail}</span></button>)}</div>
    </>;

    if (step.id === "debrief") return <>
      {ending && <div className="ending-card"><span>你的结局</span><h3>{ending.title}</h3><p>{ending.summary}</p></div>}
      <div className="debrief-fields"><label>一颗星 · 最喜欢的瞬间<textarea value={state.choices.star ?? ""} onChange={(event) => onChange(updateDraftChoice(state, "star", event.target.value))} placeholder="例如：在车顶选择相信灯里。" /></label><label>一个愿 · 下次想尝试<textarea value={state.choices.wish ?? ""} onChange={(event) => onChange(updateDraftChoice(state, "wish", event.target.value))} placeholder="例如：和真人队友一起交换秘密。" /></label></div>
      <button className="tutorial-primary" disabled={!state.choices.star?.trim() || !state.choices.wish?.trim()} onClick={() => continueStep("第一次忍务完成，并保存了星与愿。")}>完成第一次忍务</button>
    </>;

    return <button className="tutorial-primary" onClick={() => continueStep()}>{step.next ? "继续" : "完成"}</button>;
  };

  return (
    <section className="tutorial-runner">
      <header className="tutorial-progress panel">
        <div><span>{RAIN_ZERO_LINE.meta.format}</span><h2>《{RAIN_ZERO_LINE.meta.title}》</h2></div>
        <div className="progress-copy"><span>步骤 {progress.current}/{progress.total}</span><strong>约剩 {remainingMinutes} 分钟</strong></div>
        <div className="progress-track"><i style={{ width: `${progress.percent}%` }} /></div>
      </header>

      <div className="tutorial-stage panel">
        <div className="step-heading"><div><span>{step.phase} · {step.id}</span><h2>{step.title}</h2></div><button onClick={() => onChange({ ...state, hintMode: state.hintMode === "full" ? "compact" : "full" })}>{state.hintMode === "full" ? "收起解释" : "显示解释"}</button></div>
        <div className="step-instruction"><span>现在做什么</span><p>{step.instruction}</p></div>
        {state.hintMode === "full" && <div className="step-why"><span>为什么</span><p>{step.why}</p></div>}
        <div className="step-body">
          {state.lastRoll && ((step.id === "cycle-1-result" && state.lastRoll.key === "trace-carriage") || (step.id === "cycle-2-choice" && state.lastRoll.key === "trust-akari")) && (
            <div className={`tutorial-roll ${state.lastRoll.outcome}`}><span>{state.lastRoll.dice.join(" ＋ ")}</span><strong>{state.lastRoll.total}</strong><em>{outcomeLabels[state.lastRoll.outcome]}</em></div>
          )}
          {renderStepBody()}
        </div>
      </div>

      <footer className="tutorial-safety-bar panel">
        <div><strong>安全工具</strong><span>无需解释理由</span></div>
        {state.safety.paused ? <button className="resume" onClick={() => safetyAction("resume")}>继续游戏</button> : <button onClick={() => safetyAction("pause")}>暂停</button>}
        <button onClick={() => safetyAction("fade")}>淡化当前内容</button>
        <button onClick={onToggleTableSafe}>{tableSafe ? "退出桌面安全" : "隐藏秘密"}</button>
        <a href="https://ttrpgsafetytoolkit.com/" target="_blank" rel="noreferrer">安全工具说明 ↗</a>
      </footer>
    </section>
  );
}
