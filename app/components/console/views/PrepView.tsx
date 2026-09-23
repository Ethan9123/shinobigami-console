import type { SessionBrief } from "../../../lib/session";
import { useConsole } from "../context";

export default function PrepView() {
  const {
    allNinpo, applyHandoutToCharacter, brief, characters, checkpoint, handouts, preflightIssues, prepBlockers,
    prepWarnings, resizeHandouts, setNinpoSkill, startSession, tableSafe, updateBrief, updateHandout, updateRequirements,
  } = useConsole();

  return (
    <>
      <section className="panel prep-brief-panel">
        <div className="panel-heading battle-heading">
          <div><span>SESSION PRE-FLIGHT</span><h2>开团公告与约束</h2></div>
          <span className="selection-count">{prepBlockers.length ? `${prepBlockers.length} 项阻塞` : "可以开团"}</span>
        </div>
        <div className="source-audit">
          <strong>本地资料体检</strong>
          <p>本工具不读取、不上传本机的规则书、字幕或其他本地文件；所有导入内容只在当前浏览器内解析，团务数据默认只存在本地存档中。</p>
        </div>
        <div className="brief-grid">
          <label className="brief-title">忍务名称<input value={brief.title} onChange={(event) => updateBrief({ title: event.target.value })} /></label>
          <label>规制<input value={brief.regulation} onChange={(event) => updateBrief({ regulation: event.target.value })} /></label>
          <label>剧本类型<input value={brief.scenarioType} onChange={(event) => updateBrief({ scenarioType: event.target.value })} /></label>
          <label>玩家人数<input type="number" min="1" max="12" value={brief.playerCount} onChange={(event) => updateBrief({ playerCount: Math.max(1, Number(event.target.value) || 1) })} /></label>
          <label>巡数<input type="number" min="1" max="20" value={brief.cycles} onChange={(event) => updateBrief({ cycles: Math.max(1, Number(event.target.value) || 1) })} /></label>
          <label>阶级<input value={brief.rank} onChange={(event) => updateBrief({ rank: event.target.value })} /></label>
          <label>角色卡<select value={brief.characterMode} onChange={(event) => updateBrief({ characterMode: event.target.value as SessionBrief["characterMode"] })}><option value="新卡">新卡</option><option value="续卡">续卡</option><option value="混合">混合</option></select></label>
          <label>GM 难度<input value={brief.gmDifficulty} onChange={(event) => updateBrief({ gmDifficulty: event.target.value })} /></label>
          <label>交卡期限<input type="datetime-local" value={brief.submissionDeadline} onChange={(event) => updateBrief({ submissionDeadline: event.target.value })} /></label>
          <label className="brief-rules">允许规则与扩展<textarea value={brief.allowedRules} onChange={(event) => updateBrief({ allowedRules: event.target.value })} placeholder="记录本团可用的扩展、下位流派或特殊规则；不要粘贴规则书原文。" /></label>
        </div>
        <div className="quota-strip">
          <span>角色卡检查值</span>
          <label>特技<input type="number" min="0" max="30" value={brief.requirements.requiredSkills} onChange={(event) => updateRequirements({ requiredSkills: Number(event.target.value) })} /></label>
          <label>忍法槽<input type="number" min="0" max="30" value={brief.requirements.requiredNinpoSlots} onChange={(event) => updateRequirements({ requiredNinpoSlots: Number(event.target.value) })} /></label>
          <label>忍具<input type="number" min="0" max="30" value={brief.requirements.requiredTools} onChange={(event) => updateRequirements({ requiredTools: Number(event.target.value) })} /></label>
          <button onClick={resizeHandouts}>按人数整理 PC 位</button>
          <em>接近战攻击为基础忍法，不计入忍法槽；扩展规则可直接调整检查值。</em>
        </div>
      </section>

      <section className="panel handout-panel">
        <div className="panel-heading battle-heading"><div><span>PRIVATE HANDOUTS</span><h2>PC 分配与秘密交付</h2></div><span className="selection-count">{handouts.length} 份</span></div>
        <div className="handout-list">
          {handouts.map((handout) => {
            const assigned = characters.find((character) => character.id === handout.assignedCharacterId);
            return <article key={handout.id} className="handout-card">
              <div className="handout-head"><strong>{handout.slot}</strong><span>{assigned?.name ?? "未分配"}</span></div>
              <div className="handout-fields">
                <label>分配角色<select value={handout.assignedCharacterId} onChange={(event) => updateHandout(handout.id, { assignedCharacterId: event.target.value, delivered: false, reviewed: false, questionsResolved: false })}><option value="">尚未分配</option>{characters.filter((character) => character.role === "PC").map((character) => <option key={character.id} value={character.id}>{character.name} · {character.faction}</option>)}</select></label>
                <label>推荐流派<input value={handout.recommendedFaction} onChange={(event) => updateHandout(handout.id, { recommendedFaction: event.target.value, reviewed: false })} placeholder="不限或指定流派" /></label>
                <label>公开使命<textarea value={handout.publicMission} onChange={(event) => updateHandout(handout.id, { publicMission: event.target.value, reviewed: false })} /></label>
                <label className={tableSafe ? "masked-field" : ""}>私人秘密<textarea value={tableSafe ? "桌面安全模式：秘密已隐藏" : handout.privateSecret} disabled={tableSafe} onChange={(event) => updateHandout(handout.id, { privateSecret: event.target.value, delivered: false, questionsResolved: false })} /></label>
              </div>
              <div className="handout-actions">
                <button className={handout.delivered ? "done" : ""} onClick={() => { checkpoint(); updateHandout(handout.id, { delivered: !handout.delivered }); }}>{handout.delivered ? "✓ 秘密已送达" : "确认秘密送达"}</button>
                <button className={handout.questionsResolved ? "done" : ""} onClick={() => { checkpoint(); updateHandout(handout.id, { questionsResolved: !handout.questionsResolved }); }}>{handout.questionsResolved ? "✓ 问题已答复" : "确认私聊答复"}</button>
                <button className={handout.reviewed ? "done" : ""} onClick={() => { checkpoint(); updateHandout(handout.id, { reviewed: !handout.reviewed }); }}>{handout.reviewed ? "✓ GM 已复核" : "确认角色卡复核"}</button>
                <button onClick={() => applyHandoutToCharacter(handout)}>同步到角色卡</button>
              </div>
            </article>;
          })}
        </div>
      </section>

      <section className="panel readiness-panel">
        <div className="readiness-score"><span>READY CHECK</span><strong>{prepBlockers.length ? "未通过" : "通过"}</strong><p>{prepBlockers.length} 项阻塞 · {prepWarnings.length} 项提醒</p></div>
        <div className="readiness-issues">
          {preflightIssues.length ? preflightIssues.map((issue, index) => {
            const fixCharacter = issue.fix ? characters.find((character) => character.id === issue.characterId) : undefined;
            const fixNinpo = issue.fix ? allNinpo.find((ninpo) => ninpo.id === issue.fix?.ninpoId) : undefined;
            return <article className={issue.level} key={`${issue.code}-${issue.characterId ?? issue.handoutId ?? ""}-${index}`}><span>{issue.level === "blocker" ? "!" : "·"}</span><p>{issue.message}</p>{issue.fix && fixCharacter && fixNinpo && <button className="issue-fix" onClick={() => setNinpoSkill(fixCharacter, fixNinpo, issue.fix?.skill ?? "")}>一键指定《{issue.fix.skill}》</button>}</article>;
          }) : <article className="ready"><span>✓</span><p>公告、秘密交付、私聊确认与角色卡复核均已完成。</p></article>}
        </div>
        <div className="readiness-launch"><p>数量提醒允许 GM 按扩展规则确认后继续；秘密、分配与复核缺失会阻止误开团。</p><button onClick={startSession} disabled={Boolean(prepBlockers.length)}>完成检查，进入主要阶段 →</button></div>
      </section>
    </>
  );
}
