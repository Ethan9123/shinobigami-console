import { FIELD_NAMES, rollD6, SKILL_TABLE } from "../../../../lib/rules";
import { useConsole } from "../../context";

export default function CheckPanel() {
  const {
    addLog, automaticCheck, availableSkills, check, diceCount, fumbleLine, inAttackWindow, inReversal, lastRoll,
    modifier, odds, paralyzedSkills, reversalExempt, reversedCheck, rollCheck, rollEmotionTable, rollTableHint,
    setDiceCount, setModifier, setReversalExempt, setSubstituteSkillChoice, setSupportCostInput, setTargetSkill,
    staleReversal, substituteSkillChoice, supportCostInput, tableOptions, targetSkill,
  } = useConsole();

  return (
    <section className="panel check-panel">
      <div className="panel-heading"><div><span>2D6 CHECK</span><h2>行为判定</h2></div></div>
      <div className="check-target">
        <label>指定特技<select value={targetSkill} onChange={(event) => setTargetSkill(event.target.value)}>{FIELD_NAMES.map((field) => <optgroup label={field} key={field}>{SKILL_TABLE[field].map((skill) => <option value={skill} key={skill}>{skill}</option>)}</optgroup>)}</select></label>
        <div className="target-number"><span>目标值</span><strong>{check.target}</strong></div>
      </div>
      <label className="field-label">使用特技
        <select value={availableSkills.includes(substituteSkillChoice) ? substituteSkillChoice : "auto"} onChange={(event) => setSubstituteSkillChoice(event.target.value)}>
          <option value="auto">自动选择最近：{automaticCheck.skill}</option>
          {availableSkills.map((skill) => <option value={skill} key={skill}>{skill}{skill === automaticCheck.skill ? "（最近）" : "（主动远距代用）"}</option>)}
        </select>
      </label>
      <p className="substitution">本次使用：<b>{check.skill}</b> <span>距离 {check.distance}{check.wrapped ? `（经${[tableOptions.wrapRows ? "木莲" : "", tableOptions.wrapFields ? "魔界工学" : ""].filter(Boolean).join("/")}连通）` : ""}</span>{check.criticalOnly && <em>无可用特技：仅大成功可成功</em>}</p>
      {paralyzedSkills.length > 0 && <p className="substitution paralysis-note">{paralyzedSkills.includes(targetSkill) ? `《${targetSkill}》麻痹中，已剔除，按代用计算；` : ""}麻痹封锁 {paralyzedSkills.map((skill) => `《${skill}》`).join("")}，已从可用特技中剔除</p>}
      {staleReversal && <p className="substitution">「逆止」标签残留在战斗之外：逆止只在攻击处理～回合结束之间有效，本次判定不受影响（可在变调栏手动清除）。</p>}
      {inReversal && <label className="reversal-toggle"><input type="checkbox" checked={reversalExempt} onChange={(event) => setReversalExempt(event.target.checked)} />本判定可在逆止中进行（奥义／写明可用的忍法）</label>}
      <div className="odds-panel">
        <div><span>成功率</span><strong>{(odds.success * 100).toFixed(1)}%</strong>{reversedCheck && <em>逆止中：行为判定自动失败</em>}</div>
        <div className="odds-bar"><i className="fumble" style={{ width: `${odds.fumble * 100}%` }} /><i className="success" style={{ width: `${odds.success * 100}%` }} /></div>
        <p>大成功 {(odds.critical * 100).toFixed(1)}% · 大失败 {(odds.fumble * 100).toFixed(1)}% · 按当前骰池、修正与大失败值精确枚举</p>
      </div>
      <div className="dice-pool-control"><span>骰池</span>{[2, 3, 4, 5, 6].map((count) => <button key={count} className={diceCount === count ? "active" : ""} onClick={() => setDiceCount(count)}>{count}D</button>)}<em>多骰取高 2</em></div>
      <div className="modifier-control"><button onClick={() => setModifier((value) => value - 1)}>−</button><span>修正 <strong>{modifier > 0 ? `+${modifier}` : modifier}</strong></span><button onClick={() => setModifier((value) => value + 1)}>＋</button></div>
      {!inAttackWindow ? <div className="modifier-control"><button onClick={() => setSupportCostInput((value) => Math.max(0, value - 1))}>−</button><span>支援忍法花费 <strong>{supportCostInput}</strong>{supportCostInput ? `（大失败线 ${fumbleLine}）` : ""}</span><button onClick={() => setSupportCostInput((value) => Math.min(9, value + 1))}>＋</button></div> : null}
      <button className="roll-button" onClick={rollCheck}><span>{diceCount > 2 ? `${diceCount}SG` : "2SG"} · BCDICE STYLE</span>{reversedCheck ? "逆止：自动失败" : "投掷判定"}</button>
      {lastRoll && <div className={`roll-result ${lastRoll.result.includes("失败") ? "failed" : "passed"}`}><span>{lastRoll.dice.join(" · ")}{lastRoll.dice.length > 2 ? ` → ${lastRoll.kept.join("+")}` : ""}</span><strong>{lastRoll.total}</strong><em>{lastRoll.result}</em></div>}
      <div className="dice-pool-control quick-tables"><span>快速表骰</span><button onClick={rollEmotionTable}>ET 感情表</button><button onClick={() => rollTableHint("FT", "大失败表")}>FT 出目</button><button onClick={() => rollTableHint("WT", "变调表")}>WT 出目</button><button onClick={() => addLog(`[1D6] 素点：${rollD6()}。`, "roll")}>1D6</button><em>ET 给出感情对；FT／WT 只给出目，效果请对照规则书</em></div>
    </section>
  );
}
