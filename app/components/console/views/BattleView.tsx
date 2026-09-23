import ActionPanel from "./battle/ActionPanel";
import CheckPanel from "./battle/CheckPanel";
import PlotPanel from "./battle/PlotPanel";
import ResolutionPanel from "./battle/ResolutionPanel";
import TreasurePanel from "./battle/TreasurePanel";

export default function BattleView() {
  return (
    <>
      <PlotPanel />

      <div className="battle-grid">
        <ActionPanel />

        <CheckPanel />
      </div>

      <ResolutionPanel />

      <TreasurePanel />
    </>
  );
}
