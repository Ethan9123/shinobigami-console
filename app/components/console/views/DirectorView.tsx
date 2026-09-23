import GmCockpit from "./director/GmCockpit";
import RelationsIntel from "./director/RelationsIntel";
import ScenarioClocks from "./director/ScenarioClocks";
import ScenePanel from "./director/ScenePanel";
import SceneTable from "./director/SceneTable";
import TranscriptDesk from "./director/TranscriptDesk";

export default function DirectorView() {
  return (
    <>
      <GmCockpit />

      <SceneTable />

      <div className="director-grid">
        <ScenePanel />

        <ScenarioClocks />
      </div>

      <TranscriptDesk />

      <RelationsIntel />
    </>
  );
}
