import { useConsole } from "../context";

export default function AssistantView() {
  const { cycle, phase, round, sceneNumber, smartHints } = useConsole();

  return (
    <div className="assistant-view">
      <div className="panel-heading"><div><span>RULE-AWARE ASSISTANT</span><h2>当前状态检查</h2></div><span className="counter">{smartHints.length}</span></div>
      <div className="hint-list">{smartHints.map((hint, index) => <article className={hint.tone} key={`${hint.title}-${index}`}><span>{hint.tone === "good" ? "✓" : hint.tone === "danger" ? "!" : "·"}</span><div><h3>{hint.title}</h3><p>{hint.detail}</p></div></article>)}</div>
      <div className="assistant-summary"><span>当前位置</span><strong>{phase === "导入" ? "开团检查" : phase === "主要" ? `第 ${cycle} 巡 · 第 ${sceneNumber} 场` : `第 ${round} 回合`}</strong><p>提示由当前状态和规则条件生成，不会替 GM 作剧情裁定。</p></div>
    </div>
  );
}
