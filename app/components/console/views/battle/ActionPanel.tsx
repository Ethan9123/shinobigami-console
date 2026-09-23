import { useSelectedConsole } from "../../context";
import { SkillOptions } from "../../shared";

export default function ActionPanel() {
  const {
    activeNinpoId, attackOverride, characters, declareNinpo, learnedNinpo, selected, selectedDesignation, selectedNinpo,
    selectedNinpoChoices, setAttackOverride, setNinpoSkill, setSelectedNinpoId, setTargetId, target,
  } = useSelectedConsole();

  return (
    <section className="panel action-panel">
      <div className="panel-heading"><div><span>ACTION</span><h2>忍法宣言</h2></div></div>
      <div className="actor-banner"><span>行动者</span><strong>{selected.name}</strong><small>布局 {selected.plot ?? "未定"} · 花费 {selected.spentCost ?? 0}/{selected.plot ?? "–"}</small></div>
      <label className="field-label">使用忍法<select value={activeNinpoId} onChange={(event) => setSelectedNinpoId(event.target.value)}>{learnedNinpo.map((ninpo) => <option value={ninpo.id} key={ninpo.id}>{ninpo.name}</option>)}</select></label>
      <div className="ninpo-card"><div className="ninpo-stats"><span>{selectedNinpo.kind}</span><span>距离 {selectedNinpo.range}</span><span>花费 {selectedNinpo.cost}</span><span className={selectedDesignation.needsChoice ? "skill-unset" : ""}>{selectedNinpoChoices.length ? (selectedDesignation.skill ? `${selectedNinpo.skill}→${selectedDesignation.skill}` : `${selectedNinpo.skill}：未指定`) : selectedDesignation.variable ? "可变（按判定面板）" : selectedNinpo.skill}</span></div><p>{selectedNinpo.summary}</p>{selectedNinpo.damage && <strong>{selectedNinpo.damage}</strong>}</div>
      {selectedDesignation.needsChoice && <label className="field-label skill-unset">指定特技（按规则于习得时选定；如需更正请在忍法配置修改）<select value="" onChange={(event) => setNinpoSkill(selected, selectedNinpo, event.target.value)}><option value="" disabled>请选择【{selectedNinpo.name}】的指定特技</option><SkillOptions choices={selectedNinpoChoices} /></select></label>}
      <label className="field-label">目标<select value={target?.id ?? ""} onChange={(event) => setTargetId(event.target.value)}>{characters.filter((character) => character.id !== selected.id && character.active).map((character) => <option value={character.id} key={character.id}>{character.name} · 布局 {character.plot ?? "?"}{character.plot === 0 ? "（布局 0：可无视距离）" : ""}</option>)}</select></label>
      {selectedNinpo.kind === "攻击" && <label className="override-toggle"><input type="checkbox" checked={attackOverride} onChange={(event) => setAttackOverride(event.target.checked)} />GM 覆盖：允许非本人行动时或本回合再次宣言攻击（追加攻击等特例）</label>}
      <button className="declare-button" onClick={declareNinpo} disabled={!target}>宣言忍法</button>
    </section>
  );
}
