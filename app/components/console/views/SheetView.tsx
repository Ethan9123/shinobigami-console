import { useSelectedConsole } from "../context";
import BackgroundSheet from "./sheet/BackgroundSheet";
import CharacterImport from "./sheet/CharacterImport";
import CharacterLibraryPanel from "./sheet/CharacterLibraryPanel";
import Dossier from "./sheet/Dossier";
import InteropPanel from "./sheet/InteropPanel";
import NinpoLoadout from "./sheet/NinpoLoadout";
import SkillMatrix from "./sheet/SkillMatrix";

export default function SheetView() {
  const { selected, updateCharacter } = useSelectedConsole();

  return (
    <section className="panel sheet-panel">
      <div className="panel-heading battle-heading"><div><span>CHARACTER WORKBENCH</span><h2>角色工作台</h2></div><span className="selection-count">{selected.faction} · {selected.rank} · {selected.skills.length} 特技</span></div>
      <Dossier />
      <BackgroundSheet />
      <div className="ougi-grid">
        <label>奥义名<input value={selected.ougi} onChange={(event) => updateCharacter(selected.id, { ougi: event.target.value })} /></label>
        <label>指定特技<input value={selected.ougiSkill ?? ""} onChange={(event) => updateCharacter(selected.id, { ougiSkill: event.target.value })} /></label>
        <label>效果<input value={selected.ougiEffect ?? ""} onChange={(event) => updateCharacter(selected.id, { ougiEffect: event.target.value })} /></label>
        <label>强化<input value={selected.ougiStrength ?? ""} onChange={(event) => updateCharacter(selected.id, { ougiStrength: event.target.value })} /></label>
        <label>弱点<input value={selected.ougiWeakness ?? ""} onChange={(event) => updateCharacter(selected.id, { ougiWeakness: event.target.value })} /></label>
      </div>
      <SkillMatrix />
      <CharacterImport />
      <CharacterLibraryPanel />
      <InteropPanel />
      <NinpoLoadout />
    </section>
  );
}
