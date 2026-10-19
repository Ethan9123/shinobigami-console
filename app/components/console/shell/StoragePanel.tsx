import { useConsole } from "../context";
import type { StorageStatus } from "../../../lib/device-storage";

const messages: Record<StorageStatus, string> = {
  loading: "正在读取设备数据。",
  saved: "已保存到当前浏览器。",
  invalid: "原数据无法读取，已暂停覆盖并保留原文；这一项暂用默认值。请先下载设备原始数据供修复。",
  conflict: "检测到其他标签页或窗口修改了这一项，已暂停覆盖。请先备份本页，再重新载入，或明确选择用本页覆盖。",
  unavailable: "浏览器存储无法读取或写入。请先备份，再检查浏览器设置；读取被阻止时需要重新载入。",
  quota: "设备存储空间不足，本页最新改动尚未保存。请先备份，减少立绘或记录大小后重试。",
};

export default function StoragePanel() {
  const { exportDeviceBackup, exportRawDeviceData, hydrated, importRef, storageSlots, storageUnsafe } = useConsole();
  return (
    <details className={`storage-panel ${storageUnsafe ? "storage-warning" : ""}`} open={storageUnsafe || undefined}>
      <summary>
        <span role="status" aria-live="polite">{!hydrated ? "正在读取存档…" : storageUnsafe ? "⚠ 部分数据未保存 · 请先备份" : "✓ 本设备已保存"}</span>
        <span>保存与备份</span>
      </summary>
      <div className="storage-body">
        <p>数据只保存在当前浏览器，不会自动同步。GitHub Pages、Cloudflare、不同设备或浏览器之间，请通过完整备份迁移。</p>
        <p><strong>完整备份包含会话、角色库、学习进度、语言偏好，以及角色秘密与未公开布局。</strong>桌面安全模式不会删去备份中的秘密，请勿直接发给玩家。普通“导出存档”只包含会话。</p>
        <div className="storage-actions">
          <button className="ghost-button" onClick={exportDeviceBackup} disabled={!hydrated}>下载完整备份</button>
          <button className="ghost-button" onClick={() => importRef.current?.click()} disabled={!hydrated}>导入存档／完整备份</button>
          {storageUnsafe && <>
            <button className="ghost-button" onClick={exportRawDeviceData}>下载设备原始数据</button>
            <button className="ghost-button" onClick={() => {
              if (window.confirm("重新载入会丢弃本页尚未保存的改动，改用设备中的数据。请先下载完整备份。继续？")) window.location.reload();
            }}>重新载入设备数据</button>
          </>}
        </div>
        <ul className="storage-status-list">
          {storageSlots.map((slot) => <li key={slot.key}>
            <strong>{slot.label}</strong><span>{messages[slot.status]}</span>
            {(slot.status === "quota" || slot.status === "unavailable") && <button className="ghost-button" onClick={slot.retry}>重试保存{slot.label}</button>}
            {(slot.status === "invalid" || slot.status === "conflict" || slot.status === "unavailable") && <button className="ghost-button" onClick={() => {
              if (window.confirm(`将用当前页面的「${slot.label}」覆盖设备原有数据并恢复自动保存，此操作无法撤销。若本页显示的是默认示例，原数据会被替换。请先下载完整备份和设备原始数据。确定覆盖？`)) slot.replace();
            }}>用本页覆盖{slot.label}</button>}
          </li>)}
        </ul>
        {storageUnsafe && <p>异常项已暂停覆盖或保存失败；其他正常项仍可保存。备份当前页面不会自动修复设备原始数据，关闭前请确认提示已解除或已下载所需文件。</p>}
      </div>
    </details>
  );
}
