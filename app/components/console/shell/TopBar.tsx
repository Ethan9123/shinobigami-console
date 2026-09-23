import { t } from "../../../lib/i18n";
import { useConsole } from "../context";

export default function TopBar() {
  const { advanceTurn, history, locale, newRound, revealed, round, undo } = useConsole();

  return (
    <header className="topbar">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">忍</span>
        <div><p className="eyebrow">SHINOBIGAMI · SESSION CONSOLE</p><h1>忍神控制台</h1></div>
        <span className="version">MVP 1.8.0</span>
      </div>
      <div className="top-actions">
        <div className="round-badge"><span>ROUND</span><strong>{String(round).padStart(2, "0")}</strong></div>
        <button className="ghost-button" onClick={undo} disabled={!history.length}>{t("chrome.undo", locale)}</button>
        <button className="ghost-button" onClick={newRound}>{t("chrome.newRound", locale)}</button>
        <button className="primary-button" onClick={advanceTurn} disabled={!revealed}>{t("chrome.nextActor", locale)}</button>
      </div>
    </header>
  );
}
