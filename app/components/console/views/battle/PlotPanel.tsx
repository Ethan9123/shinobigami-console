import { checkFumbleLine } from "../../../../lib/rules";
import { useConsole } from "../../context";

export default function PlotPanel() {
  const { battleOrder, characters, revealPlots, revealed, selectCharacter, setPlot, setTurnIndex, tableSafe, turnIndex } = useConsole();
  const hidePlots = tableSafe && !revealed;
  const activeCharacters = characters.filter((character) => character.active);

  return (
    <section className="panel plot-panel">
      <div className="panel-heading battle-heading">
        <div><span>SECRET PLOT</span><h2>布局阶段</h2></div>
        <button className="reveal-button" onClick={revealPlots} disabled={revealed || !activeCharacters.some((character) => character.plot != null)}>{revealed ? "已公开" : "公开全部布局"}</button>
      </div>
      {tableSafe && <p className="plot-screen-note">{hidePlots ? "桌面安全：公开前只显示提交状态。" : "桌面安全：当前显示已公开的布局。"}录入或更改布局请切回 GM 视图。</p>}
      <div className="plot-lanes">
        {activeCharacters.map((character) => (
          <div className="plot-row" key={character.id}>
            <button className="plot-character" onClick={() => selectCharacter(character.id)}>{character.name}</button>
            {tableSafe ? <span className="plot-submission">{hidePlots ? (character.plot == null ? "待提交" : "已提交") : `布局 ${character.plot ?? "未定"}`}</span> : (
              <div className="plot-options" aria-label={`${character.name} 的布局`}>
                {[1, 2, 3, 4, 5, 6].map((plot) => <button key={plot} className={character.plot === plot ? "chosen" : ""} onClick={() => setPlot(character, plot)} aria-label={`${character.name} 选择布局 ${plot}`}>{character.plot === plot && !revealed ? "◆" : plot}</button>)}
                <button className={`plot-violation ${character.plot === 0 ? "chosen" : ""}`} onClick={() => setPlot(character, 0)} aria-label={`${character.name} 布局违规，布局值记为 0`} title="公开布局时违规（手下无骰、骰数超出或超出限制范围）：布局值为 0">违规→0</button>
              </div>
            )}
            {!hidePlots && <span className="risk-label">攻击处理大失败 ≤ {character.plot == null ? 2 : checkFumbleLine({ inAttackWindow: true, plot: character.plot })}{character.plot === 0 ? "（布局 0）" : ""}</span>}
          </div>
        ))}
      </div>
      {revealed && <div className="initiative-strip"><span>行动顺序</span>{battleOrder.map((character, index) => <button className={turnIndex % battleOrder.length === index ? "current" : ""} key={character.id} onClick={() => { selectCharacter(character.id); setTurnIndex(index); }}><b>{index + 1}</b>{character.name}<em>{character.plot ?? "?"}</em></button>)}</div>}
    </section>
  );
}
