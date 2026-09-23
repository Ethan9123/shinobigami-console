import { FIELD_NAMES, SKILL_TABLE } from "../../../../lib/rules";
import { useSelectedConsole } from "../../context";

export default function SkillMatrix() {
  const {
    applySpecialtyGaps, paralyzedSkills, selected, selectedSpecialty, specialtyGapsMatch, tableOptions, toggleGap,
    toggleLife, toggleOuterGap, toggleSkill,
  } = useSelectedConsole();

  return (
    <>
      <div className="gap-controls"><span>特技空隙</span><button className={selected.outerGapClosed ? "closed" : ""} onClick={toggleOuterGap} title="器术左侧的外空隙：仅【魔界工学】左右连通生效时计入">器术左侧（外） · {selected.outerGapClosed ? "已填" : "空白"}</button>{FIELD_NAMES.slice(0, -1).map((field, index) => <button key={field} className={selected.closedGaps?.[index] ? "closed" : ""} onClick={() => toggleGap(index)}>{field}/{FIELD_NAMES[index + 1]} · {selected.closedGaps?.[index] ? "已填" : "空白"}</button>)}<em>填黑的空隙只算 1 格；外空隙仅【魔界工学】生效时计入</em></div>
      <div className="gap-controls topology-row">
        <span className={`topology-badge ${tableOptions.wrapRows ? "on" : ""}`} title="习得【木莲】时，特技表最上一行与最下一行相邻">木莲：上下连通 {tableOptions.wrapRows ? "✓" : "–"}</span>
        <span className={`topology-badge ${tableOptions.wrapFields ? "on" : ""}`} title="习得【魔界工学】时，器术列与妖术列相邻">魔界工学：左右连通 {tableOptions.wrapFields ? "✓" : "–"}</span>
        {selectedSpecialty && !specialtyGapsMatch && <button className="specialty-gaps" onClick={applySpecialtyGaps} title="按流派得意分野覆盖当前空隙；长处背景可能改变空隙，以角色卡为准（可撤销）">按得意分野涂黑空隙（{selectedSpecialty}）</button>}
        {selectedSpecialty && specialtyGapsMatch && <em>空隙与得意分野「{selectedSpecialty}」一致</em>}
      </div>
      <div className="skill-matrix">
        {FIELD_NAMES.map((field) => <div className={`skill-column ${selected.life[field] ? "" : "disabled-field"}`} key={field}><button className="field-life" onClick={() => toggleLife(field)}><span>{field}</span><i>{selected.life[field] ? "●" : "×"}</i></button>{SKILL_TABLE[field].map((skill) => {
          const sealed = paralyzedSkills.includes(skill);
          return <button key={skill} className={[selected.skills.includes(skill) ? "learned" : "", sealed ? "paralyzed" : ""].filter(Boolean).join(" ")} title={sealed ? "麻痹中：此特技暂时不能使用（奥义的指定特技不受影响）" : undefined} onClick={() => toggleSkill(skill)}>{skill}</button>;
        })}</div>)}
      </div>
    </>
  );
}
