import { NO_SKILL } from "../../../../lib/rules";
import { evasionSkill } from "../../../../lib/session";
import { useConsole } from "../../context";

export default function ResolutionPanel() {
  const {
    beginDefense, confirmResolutionEffects, dismissResolution, resolution, resolutionActor, resolutionTarget,
    samePlotBatch, skipDefense,
  } = useConsole();

  return (
    <section className={`panel resolution-panel ${resolution ? "active" : "idle"}`}>
      <div className="panel-heading battle-heading">
        <div><span>ACTION PIPELINE</span><h2>当前结算流程</h2></div>
        <span className="selection-count">{resolution?.stage ?? "等待宣言"}</span>
      </div>
      {resolution ? <>
        <div className="resolution-summary">
          <div><span>行动者</span><strong>{resolutionActor?.name ?? "?"}</strong></div>
          <b>【{resolution.ninpoName}】</b>
          <div><span>目标</span><strong>{resolutionTarget?.name ?? "?"}</strong></div>
        </div>
        <div className="resolution-steps">
          {(["命中判定", "反应窗口", "回避判定", "效果结算", "完成"] as const).map((stage, index, stages) => {
            const currentIndex = stages.indexOf(resolution.stage);
            return <span key={stage} className={index < currentIndex ? "done" : index === currentIndex ? "current" : ""}><i>{index < currentIndex ? "✓" : index + 1}</i>{stage}</span>;
          })}
        </div>
        <div className="resolution-instruction">
          {resolution.stage === "命中判定" && <p>使用右侧行为判定完成命中判定；失败会直接结束，成功后先停在宣言窗口。</p>}
          {resolution.stage === "反应窗口" && <p>先询问是否还有同一时机的忍法、奥义或修正宣言；确认无人继续宣言后，再进入回避或直接适用效果。</p>}
          {resolution.stage === "回避判定" && <p>当前已切换到 {resolutionTarget?.name ?? "目标"}，{evasionSkill(resolution) ? `使用攻击忍法的指定特技《${evasionSkill(resolution)}》完成回避判定` : resolution.skill === NO_SKILL ? "该攻击忍法的指定特技为「无」：回避方式按忍法说明由 GM 裁定，需要判定时请在右侧手动选择特技" : "旧存档未记录攻击方的指定特技：请在右侧手动选择后完成回避判定"}；成功则结束，失败进入效果结算。</p>}
          {resolution.stage === "效果结算" && <p>{samePlotBatch.length > 1 ? `布局 ${resolutionActor?.plot} 有 ${samePlotBatch.length} 人同速：先记录结果，待同速角色都完成攻击后再统一应用生命、逆止与变调。` : "使用下方生命力与变调按钮应用结果，再确认效果已结算。"}</p>}
          {resolution.stage === "完成" && <p>本次忍法已完成。可以归档流程，或直接点击顶部“下一位”归档并推进行动顺序。</p>}
        </div>
        <div className="resolution-actions">
          {resolution.stage === "反应窗口" && <>{resolution.ninpoKind === "攻击" && <button onClick={beginDefense}>宣言完毕，进入回避</button>}<button onClick={skipDefense}>{resolution.ninpoKind === "攻击" ? "目标不回避，进入效果" : "宣言完毕，进入效果"}</button></>}
          {resolution.stage === "效果结算" && <button onClick={confirmResolutionEffects}>确认伤害与效果已处理</button>}
          {resolution.stage === "完成" && <button onClick={dismissResolution}>归档本次结算</button>}
          {resolution.stage !== "完成" && <button className="skip" onClick={dismissResolution}>GM 跳过剩余流程</button>}
        </div>
      </> : <div className="resolution-empty"><strong>宣言忍法后自动启动</strong><p>控制台会依次锁定命中、同一时机宣言、回避、效果与完成状态；未完成前会阻止误点下一位或新回合。</p></div>}
    </section>
  );
}
