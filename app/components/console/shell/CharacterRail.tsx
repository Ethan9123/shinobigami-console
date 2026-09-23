import { FIELD_NAMES } from "../../../lib/rules";
import { useSelectedConsole } from "../context";

export default function CharacterRail() {
  const { addCharacter, characters, currentActor, phase, removeSelected, revealed, selectCharacter, selected } = useSelectedConsole();

  return (
    <aside className="character-rail panel">
      <div className="panel-heading"><div><span>CHARACTERS</span><h2>登场角色</h2></div><span className="counter">{characters.length}</span></div>
      <div className="character-list">
        {characters.map((character) => {
          const remaining = FIELD_NAMES.filter((field) => character.life[field]).length + character.extraLife;
          return (
            <button key={character.id} className={`character-card ${selected.id === character.id ? "selected" : ""} ${currentActor?.id === character.id && revealed ? "current-turn" : ""} ${character.active ? "" : "inactive"}`} onClick={() => selectCharacter(character.id)}>
              <span className={`role-chip ${character.role.toLowerCase()}`}>{character.role}</span>
              <span className="character-name">{character.name}</span>
              <span className="character-meta">{character.faction} · {character.rank}{!character.active ? " · 已脱落" : phase === "主要" ? ` · ${character.acted ? "已行动" : "未行动"}` : ""}</span>
              <span className="life-dots" aria-label={`剩余生命力 ${remaining}`}>{FIELD_NAMES.map((field) => <i key={field} className={character.life[field] ? "alive" : "lost"} />)}</span>
              <span className={`plot-token ${revealed ? "revealed" : ""}`}>{character.plot == null ? "–" : revealed ? character.plot : "?"}</span>
            </button>
          );
        })}
      </div>
      <div className="rail-actions"><button onClick={() => addCharacter("PC")}>＋ PC</button><button onClick={() => addCharacter("NPC")}>＋ NPC</button></div>
      <button className="danger-link" onClick={removeSelected} disabled={characters.length <= 1}>移除当前角色</button>
    </aside>
  );
}
