import type { SceneOracleLikelihood } from "../../../../lib/director";
import type { SceneAction } from "../../../../lib/session";
import { useConsole } from "../../context";

export default function SceneTable() {
  const {
    appendOracleResult, appendSceneCard, appendSceneDeck, lockedSceneCards, oracleLikelihood, oracleQuestion,
    oracleResult, rerollSceneCards, runSceneOracle, sceneAction, sceneCards, setOracleLikelihood, setOracleQuestion,
    setSceneAction, spotlightLedger, toggleSceneCardLock,
  } = useConsole();

  return (
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
  );
}
