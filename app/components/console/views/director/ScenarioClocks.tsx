import { useConsole } from "../../context";

export default function ScenarioClocks() {
  const {
    addCue, addTracker, cueCycle, cueScene, cueTitle, cues, dueCues, setCueCycle, setCueScene, setCueTitle, setTrackerMax,
    setTrackerName, tableSafe, toggleCue, trackerMax, trackerName, trackers, updateTracker,
  } = useConsole();

  return (
    <section className="panel scenario-panel">
      <div className="panel-heading"><div><span>SCENARIO CLOCKS</span><h2>事件与进度</h2></div></div>
      <div className="tracker-list">{trackers.map((tracker) => <article key={tracker.id}><div><strong>{tracker.name}</strong><span>{tracker.value}/{tracker.max}</span></div><div className="tracker-bar"><i style={{ width: `${tracker.max ? (tracker.value / tracker.max) * 100 : 0}%` }} /></div><div className="tracker-buttons"><button onClick={() => updateTracker(tracker.id, -1)}>−</button><button onClick={() => updateTracker(tracker.id, 1)}>＋</button></div></article>)}</div>
      <div className="inline-form tracker-form"><input value={trackerName} onChange={(event) => setTrackerName(event.target.value)} placeholder="新进度名称" /><input aria-label="进度上限" type="number" min="2" max="20" value={trackerMax} onChange={(event) => setTrackerMax(Number(event.target.value))} /><button onClick={addTracker}>添加</button></div>
      <div className="cue-heading"><strong>主持事件</strong><span>到点自动提醒，不自动公开内容</span></div>
      <div className="cue-list">{cues.length ? cues.slice().sort((a, b) => a.cycle - b.cycle || a.scene - b.scene).map((cue) => <button key={cue.id} className={`${cue.done ? "done" : ""} ${dueCues.some((item) => item.id === cue.id) ? "due" : ""}`} onClick={() => toggleCue(cue.id)}><span>C{cue.cycle}·S{cue.scene}</span><b>{tableSafe ? "主持事件已隐藏" : cue.title}</b><em>{cue.done ? "已处理" : "待处理"}</em></button>) : <p className="empty-log">还没有安排主持事件。</p>}</div>
      <div className="cue-form"><input value={cueTitle} onChange={(event) => setCueTitle(event.target.value)} placeholder="例如：公开档案或检查条件" /><label>巡<input type="number" min="1" value={cueCycle} onChange={(event) => setCueCycle(Number(event.target.value))} /></label><label>场<input type="number" min="1" value={cueScene} onChange={(event) => setCueScene(Number(event.target.value))} /></label><button onClick={addCue}>安排</button></div>
    </section>
  );
}
