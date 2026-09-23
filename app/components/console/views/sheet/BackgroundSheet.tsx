import { useSelectedConsole } from "../../context";

export default function BackgroundSheet() {
  const { addBackgroundItem, removeBackgroundItem, selected, updateBackgroundItem } = useSelectedConsole();

  return (
    <section className="background-sheet">
      <div className="subsection-heading"><div><span>BACKGROUND LIST</span><h3>背景清单</h3></div><small>结构化条目支持从纯文本角色卡自动识别</small></div>
      <div className="background-table" role="table" aria-label="背景清单">
        <div className="background-table-head" role="row"><span>序号</span><span>名称</span><span>类别</span><span>功绩点</span><span>效果</span><span /></div>
        {selected.backgroundItems.length ? selected.backgroundItems.map((item) => <div className="background-table-row" role="row" key={item.id}>
          <input aria-label="背景序号" value={item.serial} onChange={(event) => updateBackgroundItem(item.id, { serial: event.target.value })} placeholder="序号" />
          <input aria-label="背景名称" value={item.name} onChange={(event) => updateBackgroundItem(item.id, { name: event.target.value })} />
          <input aria-label="背景类别" value={item.category} onChange={(event) => updateBackgroundItem(item.id, { category: event.target.value })} placeholder="长处／短处" />
          <input aria-label="背景功绩点" type="number" value={item.points} onChange={(event) => updateBackgroundItem(item.id, { points: Number(event.target.value) || 0 })} />
          <input aria-label="背景效果" value={item.effect} onChange={(event) => updateBackgroundItem(item.id, { effect: event.target.value })} placeholder="效果摘要（勿粘贴规则书原文）" />
          <button aria-label={`删除背景 ${item.name}`} onClick={() => removeBackgroundItem(item.id)}>×</button>
        </div>) : <p className="empty-log">还没有结构化背景；可手动添加，或粘贴角色卡文本自动识别背景清单行。</p>}
      </div>
      <div className="background-foot">
        <button onClick={addBackgroundItem}>＋ 添加背景</button>
        <em>功绩点小计：{selected.backgroundItems.reduce((sum, item) => sum + item.points, 0)}（长处为正、短处为负）</em>
      </div>
    </section>
  );
}
