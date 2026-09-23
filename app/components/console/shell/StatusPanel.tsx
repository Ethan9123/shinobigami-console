import { CONDITIONS, FIELD_NAMES } from "../../../lib/rules";
import type { Character } from "../../../lib/session";
import { useSelectedConsole } from "../context";

export default function StatusPanel() {
  const {
    clearParalysis, legacyParalysis, paralyzedSkills, selected, toggleActive, toggleCondition, toggleLife,
    updateCharacter, updateTool,
  } = useSelectedConsole();

  return (
    <section className="panel status-panel">
      <div className="status-block life-block"><span className="mini-label">LIFE / 生命力</span><div className="field-toggles">{FIELD_NAMES.map((field) => <button key={field} className={selected.life[field] ? "healthy" : "lost"} onClick={() => toggleLife(field)}><i />{field}</button>)}</div><div className="extra-life"><span>追加生命力</span><button onClick={() => updateCharacter(selected.id, { extraLife: Math.max(0, selected.extraLife - 1) })}>−</button><strong>{selected.extraLife}</strong><button onClick={() => updateCharacter(selected.id, { extraLife: selected.extraLife + 1 })}>＋</button><button className={`active-toggle ${selected.active ? "" : "dropped"}`} onClick={toggleActive}>{selected.active ? "参战中" : "已脱落"}</button></div></div>
      <div className="status-block"><span className="mini-label">CONDITION / 变调·状态</span><div className="condition-list">{CONDITIONS.map((condition) => condition === "麻痹"
        ? <button key={condition} className={selected.conditions.includes(condition) ? "active" : ""} onClick={() => toggleCondition(condition)} title="点击追加一层：随机封锁 1 个尚未被封的已习得特技">{paralyzedSkills.length ? `麻痹×${paralyzedSkills.length}` : condition}</button>
        : <button key={condition} className={selected.conditions.includes(condition) ? "active" : ""} onClick={() => toggleCondition(condition)}>{condition}</button>)}
        {selected.conditions.includes("麻痹") && <button className="condition-clear" onClick={clearParalysis}>全部解除（身体操术判定成功）</button>}
      </div>
      {paralyzedSkills.length > 0 && <p className="paralysis-note">麻痹封锁：{paralyzedSkills.map((skill) => `《${skill}》`).join("")}（奥义的指定特技不受影响）</p>}
      {legacyParalysis && <p className="paralysis-note warn">旧存档未记录被封特技，请补抽：点「麻痹」随机封锁一层，或点「全部解除」。</p>}</div>
      <div className="status-block"><span className="mini-label">TOOLS / 忍具</span><div className="tool-list">{(Object.keys(selected.tools) as Array<keyof Character["tools"]>).map((tool) => <div key={tool}><span>{tool}</span><button onClick={() => updateTool(tool, -1)}>−</button><b>{selected.tools[tool]}</b><button onClick={() => updateTool(tool, 1)}>＋</button></div>)}</div></div>
    </section>
  );
}
