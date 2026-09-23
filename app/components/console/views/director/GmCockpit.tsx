import { GM_BEATS } from "../../../../lib/gm";
import type { GmPressure } from "../../../../lib/gm";
import { useConsole } from "../../context";

export default function GmCockpit() {
  const {
    acceptGmSpotlight, acceptSuggestedAction, advanceGmBeat, appendGmDirection, dueCues, gmBeat, gmBrief, gmPressure,
    sceneAction, setGmBeat, setGmPressure,
  } = useConsole();

  return (
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
  );
}
