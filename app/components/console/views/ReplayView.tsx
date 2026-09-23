import type { ReplayEnding, ReplayGenre, ReplayLength, ReplayMode } from "../../../lib/replay";
import { useConsole } from "../context";

export default function ReplayView() {
  const {
    characters, createReplay, exportReplay, replay, replayEnding, replayGenre, replayHeroId, replayIntensity,
    replayLength, replayMode, replayRevealSecrets, replaySeed, rerollReplay, sendReplayToDesk, setReplayEnding,
    setReplayGenre, setReplayHeroId, setReplayIntensity, setReplayLength, setReplayMode, setReplayRevealSecrets,
    setReplaySeed, tableSafe,
  } = useConsole();

  return (
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
          <label>生成模式<select value={replayMode} onChange={(event) => setReplayMode(event.target.value as ReplayMode)}>{(["戏剧节拍", "实战巡回"] as ReplayMode[]).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>主角<select value={replayHeroId} onChange={(event) => setReplayHeroId(event.target.value)}>{characters.filter((character) => character.role === "PC").map((character) => <option key={character.id} value={character.id}>{character.name} · {character.faction}</option>)}</select></label>
          <label>故事类型<select value={replayGenre} onChange={(event) => setReplayGenre(event.target.value as ReplayGenre)}>{(["都市悬疑", "学园怪谈", "黑色谍战", "热血决战"] as ReplayGenre[]).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>篇幅<select value={replayLength} onChange={(event) => setReplayLength(event.target.value as ReplayLength)}>{(["短篇", "标准", "长篇"] as ReplayLength[]).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>结局<select value={replayEnding} onChange={(event) => setReplayEnding(event.target.value as ReplayEnding)}>{(["苦涩胜利", "破晓逆转", "开放悬念", "任务失败"] as ReplayEnding[]).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
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
  );
}
