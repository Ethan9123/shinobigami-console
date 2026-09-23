"use client";

import type { ComponentType } from "react";
import TutorialRunner from "./tutorial/TutorialRunner";
import { ConsoleContext } from "./console/context";
import type { ConsoleView } from "./console/context";
import { useConsoleController } from "./console/useConsoleController";
import CharacterRail from "./console/shell/CharacterRail";
import ModeNav from "./console/shell/ModeNav";
import StatusPanel from "./console/shell/StatusPanel";
import TopBar from "./console/shell/TopBar";
import SidePanel from "./console/side/SidePanel";
import AcademyView from "./console/views/AcademyView";
import BattleView from "./console/views/BattleView";
import DirectorView from "./console/views/DirectorView";
import PrepView from "./console/views/PrepView";
import ReplayView from "./console/views/ReplayView";
import SheetView from "./console/views/SheetView";

const VIEWS: Record<Exclude<ConsoleView, "tutorial">, ComponentType> = {
  academy: AcademyView,
  prep: PrepView,
  replay: ReplayView,
  battle: BattleView,
  director: DirectorView,
  sheet: SheetView,
};

export default function ShinobigamiConsole() {
  const ctl = useConsoleController();
  const { changeTutorial, selected, setTableSafe, setView, startTutorial, tableSafe, tutorial, view } = ctl;

  // 所有视图（包括 useSelectedConsole 的面板）都依赖这里先挡掉没有当前角色的情况
  if (!selected) return null;

  const MainView = view === "tutorial" ? null : VIEWS[view];

  return (
    <ConsoleContext.Provider value={ctl}>
    <main className="console-shell">
      <TopBar />

      <ModeNav />

      <div className={`workspace ${view === "tutorial" || view === "academy" ? "tutorial-workspace" : ""}`}>
        {view !== "tutorial" && view !== "academy" && <CharacterRail />}

        <section className="main-stage">
          {MainView ? <MainView /> : (
            <TutorialRunner
              state={tutorial}
              tableSafe={tableSafe}
              onChange={changeTutorial}
              onStart={startTutorial}
              onToggleTableSafe={() => setTableSafe((value) => !value)}
              onOpenConsole={(nextView) => setView(nextView)}
            />
          )}

          {view !== "tutorial" && <StatusPanel />}
        </section>

        {view !== "tutorial" && <SidePanel />}
      </div>
    </main>
    </ConsoleContext.Provider>
  );
}
