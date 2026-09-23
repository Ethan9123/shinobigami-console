import { designatedSkillChoices, FIELD_NAMES, resolveDesignatedSkill, SKILL_TABLE } from "../../../../lib/rules";
import type { Ninpo } from "../../../../lib/rules";
import { useSelectedConsole } from "../../context";
import { SkillOptions } from "../../shared";

export default function NinpoLoadout() {
  const {
    addCustomNinpo, allNinpo, customCost, customKind, customName, customNinpo, customNote, customRange, customSkill,
    customSummary, deleteCustomNinpo, selected, setCustomCost, setCustomKind, setCustomName, setCustomNote,
    setCustomRange, setCustomSkill, setCustomSummary, setNinpoSkill, toggleNinpo,
  } = useSelectedConsole();

  return (
    <>
      <section className="equipped-ninpo-sheet">
        <div className="subsection-heading"><div><span>AUTOMATIC NINPO LIST</span><h3>已装备忍法清单</h3></div><small>效果仅保存你的摘要；完整规则仍以所用规则书为准</small></div>
        <div className="ninpo-table" role="table" aria-label="已装备忍法清单">
          <div className="ninpo-table-head" role="row"><span>忍法</span><span>类型</span><span>指定特技</span><span>距离</span><span>花费</span><span>效果摘要</span></div>
          {allNinpo.filter((ninpo) => selected.ninpoIds.includes(ninpo.id)).map((ninpo) => <div className="ninpo-table-row" role="row" key={ninpo.id}><strong>{ninpo.name}{(ninpo.serial || ninpo.school) && <small className="ninpo-origin">{[ninpo.serial, ninpo.school].filter(Boolean).join(" · ")}</small>}</strong><span>{ninpo.kind}</span><span>{(() => {
            if (!designatedSkillChoices(ninpo).length) return ninpo.skill;
            const resolved = resolveDesignatedSkill(ninpo, selected.ninpoSkills ?? {}).skill;
            return resolved ? `${ninpo.skill}→${resolved}` : <em className="skill-unset">{ninpo.skill}：未指定</em>;
          })()}</span><span>{ninpo.range >= 99 ? "无" : ninpo.range}</span><span>{ninpo.cost || "无"}</span><p>{ninpo.summary}{ninpo.note && <span className="ninpo-note">备忘：{ninpo.note}</span>}</p></div>)}
        </div>
      </section>
      <section className="ninpo-loadout">
        <div className="subsection-heading"><div><span>REPEATING LOADOUT</span><h3>忍法配置</h3></div><small>点击添加或移出当前角色</small></div>
        <div className="ninpo-library">{allNinpo.map((ninpo) => {
          const equipped = selected.ninpoIds.includes(ninpo.id);
          const choices = equipped ? designatedSkillChoices(ninpo) : [];
          const chosen = choices.length ? resolveDesignatedSkill(ninpo, selected.ninpoSkills ?? {}).skill : null;
          return <div className={equipped ? "equipped" : ""} key={ninpo.id}>
            <button onClick={() => toggleNinpo(ninpo.id)}><b>{ninpo.name}</b><span>{ninpo.kind} · {ninpo.skill} · 距{ninpo.range >= 99 ? "无" : ninpo.range} · 费{ninpo.cost}</span></button>
            {choices.length > 0 && <label className={`ninpo-skill-pick ${chosen ? "" : "skill-unset"}`}>指定特技<select aria-label={`${ninpo.name} 的指定特技`} value={chosen ?? ""} onChange={(event) => setNinpoSkill(selected, ninpo, event.target.value)}><option value="">未指定</option><SkillOptions choices={choices} /></select></label>}
            {customNinpo.some((item) => item.id === ninpo.id) && <button className="remove-custom" aria-label={`删除自定义忍法 ${ninpo.name}`} onClick={() => deleteCustomNinpo(ninpo.id)}>×</button>}
          </div>;
        })}</div>
        <div className="custom-ninpo-form">
          <input aria-label="自定义忍法名" placeholder="自定义忍法名" value={customName} onChange={(event) => setCustomName(event.target.value)} />
          <select aria-label="忍法类型" value={customKind} onChange={(event) => setCustomKind(event.target.value as Ninpo["kind"])}><option value="攻击">攻击</option><option value="支援">支援</option><option value="装备">装备</option></select>
          <select aria-label="指定特技" value={customSkill} onChange={(event) => setCustomSkill(event.target.value)}><option value="自由">自由（习得时指定）</option><option value="无">无（无需判定）</option>{FIELD_NAMES.map((field) => <optgroup label={field} key={field}>{SKILL_TABLE[field].map((skill) => <option key={skill} value={skill}>{skill}</option>)}</optgroup>)}</select>
          <label>距离<input type="number" min="0" max="99" value={customRange} onChange={(event) => setCustomRange(Number(event.target.value))} /></label>
          <label>花费<input type="number" min="0" max="99" value={customCost} onChange={(event) => setCustomCost(Number(event.target.value))} /></label>
          <input className="custom-summary" aria-label="自定义忍法效果摘要" placeholder="效果摘要（请勿粘贴整段规则书原文）" value={customSummary} onChange={(event) => setCustomSummary(event.target.value)} />
          <input className="custom-note" aria-label="自定义忍法备忘" placeholder="备忘（可选）" value={customNote} onChange={(event) => setCustomNote(event.target.value)} />
          <button onClick={addCustomNinpo}>＋ 加入配置</button>
        </div>
      </section>
    </>
  );
}
