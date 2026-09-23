import { LOCALES, t } from "../../../lib/i18n";
import type { Phase } from "../../../lib/session";
import { useConsole } from "../context";

export default function ModeNav() {
  const {
    changePhase, exportSave, importRef, importSave, locale, phase, setTableSafe, setView, switchLocale, tableSafe, view,
  } = useConsole();

  return (
    <nav className="mode-tabs" aria-label="主要视图">
      <button className={view === "academy" ? "active academy-tab" : "academy-tab"} onClick={() => setView("academy")}>{t("nav.academy", locale)}</button>
      <button className={view === "tutorial" ? "active first-mission-tab" : "first-mission-tab"} onClick={() => setView("tutorial")}>{t("nav.tutorial", locale)}</button>
      <button className={view === "prep" ? "active" : ""} onClick={() => setView("prep")}>{t("nav.prep", locale)}</button>
      <button className={view === "replay" ? "active replay-tab" : "replay-tab"} onClick={() => setView("replay")}>{t("nav.replay", locale)}</button>
      <button className={view === "battle" ? "active" : ""} onClick={() => setView("battle")}>{t("nav.battle", locale)}</button>
      <button className={view === "director" ? "active" : ""} onClick={() => setView("director")}>{t("nav.director", locale)}</button>
      <button className={view === "sheet" ? "active" : ""} onClick={() => setView("sheet")}>{t("nav.sheet", locale)}</button>
      <div className="phase-tabs" aria-label="团务阶段">
        {(["导入", "主要", "高潮"] as Phase[]).map((item, index) => <button key={item} className={phase === item ? "active" : ""} onClick={() => changePhase(item)}>{t(["phase.intro", "phase.main", "phase.climax"][index], locale)}</button>)}
      </div>
      <div className="save-actions">
        <div className="locale-switch" role="group" aria-label={t("chrome.language", locale)}>{LOCALES.map((item) => <button key={item.id} className={locale === item.id ? "active" : ""} onClick={() => switchLocale(item.id)}>{item.label}</button>)}</div>
        <button className={tableSafe ? "safe-active" : ""} onClick={() => setTableSafe((value) => !value)}>{tableSafe ? t("chrome.tableSafe", locale) : t("chrome.gmView", locale)}</button>
        <button onClick={exportSave}>{t("chrome.export", locale)}</button><button onClick={() => importRef.current?.click()}>{t("chrome.import", locale)}</button>
        <input ref={importRef} type="file" accept="application/json" onChange={importSave} hidden />
      </div>
    </nav>
  );
}
