import { useConsole } from "../context";
import AssistantView from "./AssistantView";
import RulesCheatsheet from "./RulesCheatsheet";
import SessionLog from "./SessionLog";

export default function SidePanel() {
  const { clearSession, setSideView, sideView } = useConsole();

  return (
    <aside className="log-panel panel">
      <div className="side-tabs"><button className={sideView === "assistant" ? "active" : ""} onClick={() => setSideView("assistant")}>智能提示</button><button className={sideView === "log" ? "active" : ""} onClick={() => setSideView("log")}>团务记录</button><button className={sideView === "rules" ? "active" : ""} onClick={() => setSideView("rules")}>规则速查</button></div>
      {sideView === "assistant" ? <AssistantView /> : sideView === "log" ? <SessionLog /> : <RulesCheatsheet />}
      <div className="log-footer"><button onClick={clearSession}>重置示例团</button><p>本工具仅提供规则辅助，特殊效果以 GM 裁定为准。</p></div>
    </aside>
  );
}
