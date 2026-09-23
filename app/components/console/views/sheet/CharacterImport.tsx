import { useConsole } from "../../context";

export default function CharacterImport() {
  const {
    applyCharacterImport, importPreview, importText, importWorkbookFile, setImportText, setWorkbookImport, workbookImport,
    workbookImportStatus, workbookRef,
  } = useConsole();

  return (
    <section className="text-importer">
      <div>
        <span>SMART IMPORT</span><h3>Excel／纯文字角色卡导入</h3>
        <p>可直接选择自动角色卡 .xlsx，也可粘贴「纯文字化」内容；文件只在当前设备解析，不会上传。</p>
        <button className="workbook-import-button" onClick={() => workbookRef.current?.click()}>选择 Excel 角色卡</button>
        <input ref={workbookRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={importWorkbookFile} hidden />
        <small className="workbook-import-status">{workbookImportStatus}</small>
      </div>
      <textarea value={importText} onChange={(event) => { setImportText(event.target.value); setWorkbookImport(null); }} placeholder={"粘贴角色卡文本，例如：\n名前：角色名\n流派：鞍马神流\n階級：中忍\n使命：……\n特技：刀術、走法……"} />
      <div className="import-preview"><span>识别 {importPreview.recognized} 项</span><b>{importPreview.name ?? "未识别姓名"}</b><em>{importPreview.skills.length} 特技 · {importPreview.ninpoIds.length} 忍法</em>{workbookImport && <small>{workbookImport.sheetName} · {workbookImport.cellCount} 个有效单元格</small>}<button onClick={applyCharacterImport} disabled={!importPreview.recognized}>应用到当前角色</button></div>
    </section>
  );
}
