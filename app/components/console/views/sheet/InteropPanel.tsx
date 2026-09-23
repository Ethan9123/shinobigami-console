import { createBCDicePalette } from "../../../../lib/interop";
import { useSelectedConsole } from "../../context";

export default function InteropPanel() {
  const {
    allNinpo, copyBCDicePalette, copyCCFoliaCharacter, downloadFoundryActor, interopPrivate, selected, setInteropPrivate,
    tableSafe,
  } = useSelectedConsole();

  return (
    <section className="interop-panel">
      <div className="subsection-heading">
        <div><span>OPEN-SOURCE BRIDGES</span><h3>开源团务互通桥</h3></div>
        <small>导出结构，不上传资料，也不内置外部项目代码或规则表正文</small>
      </div>
      <div className="interop-source-strip">
        <a href="https://github.com/bcdice/BCDice" target="_blank" rel="noreferrer"><b>BCDice</b><span>BSD-3-Clause · nSG@s#f&gt;=x</span></a>
        <a href="https://github.com/neotaso/CCFOLIA-Akyou" target="_blank" rel="noreferrer"><b>CCFOLIA Clipboard</b><span>MIT · character JSON</span></a>
        <a href="https://github.com/ksx0330/FVTT-Shinobigami-System" target="_blank" rel="noreferrer"><b>Foundry VTT</b><span>MIT · Actor / Item schema</span></a>
      </div>
      <div className="interop-body">
        <div className="interop-preview"><span>BCDice 调色板预览</span><pre>{createBCDicePalette(selected, allNinpo).split("\n").slice(0, 5).join("\n")}</pre></div>
        <div className="interop-actions">
          <label className={tableSafe ? "disabled" : ""}><input type="checkbox" checked={interopPrivate && !tableSafe} disabled={tableSafe} onChange={(event) => setInteropPrivate(event.target.checked)} />导出时包含秘密与奥义</label>
          <p>{tableSafe ? "桌面安全模式已锁定：所有出口只含公开资料。" : interopPrivate ? "私人资料将进入 CCFOLIA 备忘与 Foundry Handout；请只交给对应玩家或 GM。" : "默认只导出公开资料；本地立绘不会嵌入 JSON。"}</p>
          <div><button onClick={copyBCDicePalette}>复制 BCDice 调色板</button><button onClick={copyCCFoliaCharacter}>复制 CCFOLIA 角色</button><button className="foundry-export" onClick={downloadFoundryActor}>导出 Foundry Actor</button></div>
        </div>
      </div>
    </section>
  );
}
