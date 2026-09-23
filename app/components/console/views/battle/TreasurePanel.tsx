import { useConsole } from "../../context";

export default function TreasurePanel() {
  // 不从控制器取 targetId：下方每件秘宝各自计算本地的让渡目标 targetId
  const {
    addTreasure, characters, removeTreasure, setTreasureName, setTreasureNote, setTreasureTargets, transferTreasure,
    treasureName, treasureNote, treasureTargets, treasures,
  } = useConsole();

  return (
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
  );
}
