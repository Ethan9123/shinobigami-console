import type { SceneAction } from "../../../../lib/session";
import { useConsole } from "../../context";

export default function ScenePanel() {
  const {
    characters, completeScene, cycle, newCycle, sceneAction, sceneNote, sceneNumber, sceneOwnerId, sceneParticipantIds,
    setSceneAction, setSceneNote, setSceneOwnerId, setSceneParticipantIds, tableSafe, toggleSceneParticipant,
  } = useConsole();

  return (
    <section className="panel scene-panel">
      <div className="panel-heading battle-heading">
        <div><span>SCENE DIRECTOR</span><h2>第 {cycle} 巡 · 第 {sceneNumber} 场</h2></div>
        <button className="reveal-button" onClick={newCycle}>开始新巡</button>
      </div>
      <div className="scene-form">
        <label>场景玩家<select value={sceneOwnerId} onChange={(event) => { setSceneOwnerId(event.target.value); setSceneParticipantIds((items) => items.includes(event.target.value) ? items : [...items, event.target.value]); }}>{characters.filter((character) => character.role === "PC").map((character) => <option key={character.id} value={character.id}>{character.name} · {character.acted ? "已行动" : "未行动"}</option>)}</select></label>
        <label>主要行动<select value={sceneAction} onChange={(event) => setSceneAction(event.target.value as SceneAction)}>{(["未定", "回复判定", "情报判定", "感情判定", "战斗", "计划判定", "辅助判定"] as SceneAction[]).map((action) => <option key={action} value={action}>{action}</option>)}</select></label>
      </div>
      <div className="participant-picker"><span>登场人物</span>{characters.map((character) => <button key={character.id} className={sceneParticipantIds.includes(character.id) ? "active" : ""} onClick={() => toggleSceneParticipant(character.id)}>{character.name}</button>)}</div>
      <label className={`scene-note ${tableSafe ? "masked-field" : ""}`}>场景摘要或判定结果<textarea value={tableSafe ? "桌面安全模式：主持摘要已隐藏" : sceneNote} disabled={tableSafe} onChange={(event) => setSceneNote(event.target.value)} placeholder="只记录推进所需的关键词；秘密内容可留在角色卡中。" /></label>
      <button className="complete-scene" onClick={completeScene}>完成场景并轮到下一位</button>
      <div className="acted-strip">{characters.filter((character) => character.role === "PC").map((character) => <span className={character.acted ? "done" : ""} key={character.id}>{character.acted ? "✓" : "○"} {character.name}</span>)}</div>
    </section>
  );
}
