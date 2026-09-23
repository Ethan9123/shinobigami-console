import { useConsole } from "../context";

export default function SessionLog() {
  const { cycle, diceHint, diceInput, logs, phase, round, setDiceInput, setLogs, submitDiceCommand, tableSafe } = useConsole();

  return (
    <>
      <div className="panel-heading"><div><span>SESSION LOG</span><h2>{phase}阶段 · {phase === "主要" ? `第 ${cycle} 巡` : `第 ${round} 回合`}</h2></div><button className="clear-log" onClick={() => setLogs([])}>清空</button></div>
      <form className="dice-maiden" onSubmit={submitDiceCommand}>
        <input aria-label="骰娘指令" value={diceInput} onChange={(event) => setDiceInput(event.target.value)} placeholder="对骰娘说：2d6+3 · 3SG>=5 · rh 暗骰 · draw 地点 · jrrp · help" />
        <button type="submit">掷</button>
        {diceHint ? <p className="dice-maiden-hint">{diceHint}</p> : null}
      </form>
      <div className="log-list">{logs.length ? logs.slice().reverse().map((entry) => <article className={`log-entry ${entry.tone}`} key={entry.id}><span>{phase === "主要" ? `C${entry.cycle ?? cycle}` : `R${entry.round}`}</span><p>{tableSafe ? "桌面安全模式：记录内容已隐藏" : entry.text}</p></article>) : <p className="empty-log">还没有记录。</p>}</div>
    </>
  );
}
