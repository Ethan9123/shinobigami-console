import { EMOTION_PAIRS } from "../../../../lib/rules";
import type { IntelKind } from "../../../../lib/session";
import { useConsole } from "../../context";

export default function RelationsIntel() {
  const {
    addEmotion, characters, emotionFromId, emotionIndex, emotionPositive, emotionToId, emotions, gainIntel, intel,
    intelKind, intelReceiverId, intelSubjectId, markEmotionUsed, setEmotionFromId, setEmotionIndex, setEmotionPositive,
    setEmotionToId, setIntelKind, setIntelReceiverId, setIntelSubjectId,
  } = useConsole();

  return (
    <section className="panel intel-panel">
      <div className="panel-heading battle-heading"><div><span>RELATIONSHIP & INTEL</span><h2>人物关系与情报流向</h2></div><span className="selection-count">共享不连锁</span></div>
      <div className="relationship-grid">
        <div className="relation-builder">
          <h3>建立定向感情</h3>
          <div className="relation-form"><select value={emotionFromId} onChange={(event) => setEmotionFromId(event.target.value)}>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select><span>对</span><select value={emotionToId} onChange={(event) => setEmotionToId(event.target.value)}>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select><select value={emotionIndex} onChange={(event) => setEmotionIndex(Number(event.target.value))}>{EMOTION_PAIRS.map((pair, index) => <option key={pair.join("/")} value={index}>{pair[0]} / {pair[1]}</option>)}</select><select value={emotionPositive ? "positive" : "negative"} onChange={(event) => setEmotionPositive(event.target.value === "positive")}><option value="positive">正面</option><option value="negative">负面</option></select><button onClick={addEmotion}>逐向记录</button></div>
          <small>感情判定成功后，场景玩家与同场目标各自掷 1D6，并分别决定正面或负面；请为两个方向各记录一次。</small>
          <div className="emotion-list">{emotions.length ? emotions.map((emotion) => { const from = characters.find((character) => character.id === emotion.fromId)?.name; const to = characters.find((character) => character.id === emotion.toId)?.name; return <article key={emotion.id} className={emotion.positive ? "positive" : "negative"}><div><strong>{from}</strong><span>→</span><strong>{to}</strong><b>{emotion.label}</b></div><button className={emotion.used ? "used" : ""} onClick={() => markEmotionUsed(emotion.id)}>{emotion.used ? "本轮已修正" : `${emotion.positive ? "+1" : "−1"} 修正`}</button></article>; }) : <p className="empty-log">尚未建立感情。</p>}</div>
        </div>
        <div className="intel-builder">
          <h3>直接获得情报</h3>
          <div className="intel-form"><select value={intelReceiverId} onChange={(event) => setIntelReceiverId(event.target.value)}>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select><span>获得</span><select value={intelSubjectId} onChange={(event) => setIntelSubjectId(event.target.value)}>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select><select value={intelKind} onChange={(event) => setIntelKind(event.target.value as IntelKind)}><option value="秘密">秘密</option><option value="居所">居所</option><option value="奥义">奥义</option></select><button onClick={gainIntel}>结算共享</button></div>
          <div className="intel-list">{intel.length ? intel.map((record) => { const subjectName = characters.find((character) => character.id === record.subjectId)?.name ?? "已移除角色"; return <article key={`${record.subjectId}-${record.kind}`}><strong>{subjectName} · {record.kind}</strong><div>{record.knownBy.map((id) => <span key={id}>{characters.find((character) => character.id === id)?.name ?? "?"}</span>)}</div></article>; }) : <p className="empty-log">尚未记录已知情报。</p>}</div>
        </div>
      </div>
    </section>
  );
}
