import { checkFumbleLine } from "../../../../lib/rules";
import { useConsole } from "../../context";

export default function PlotPanel() {
  const { battleOrder, characters, revealPlots, revealed, selectCharacter, setPlot, setTurnIndex, turnIndex } = useConsole();

  return (
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
  );
}
