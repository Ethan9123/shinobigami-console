import { useConsole } from "../../context";

export default function CharacterLibraryPanel() {
  const {
    characterLibrary, characterLibraryStatus, loadCharacterFromLibrary, removeCharacterFromLibrary, saveSelectedToLibrary,
  } = useConsole();

  return (
    <section className="character-library-panel">
      <div className="subsection-heading">
        <div><span>DEVICE-LOCAL TEMPLATES</span><h3>本地角色库</h3></div>
        <button className="library-save" onClick={saveSelectedToLibrary}>保存当前角色</button>
      </div>
      <p className="library-status">{characterLibraryStatus}</p>
      {characterLibrary.length ? <div className="character-library-grid">
        {characterLibrary.map((entry) => <article key={entry.id}>
          <div><span>{entry.character.role}</span><small>{entry.savedAt.slice(0, 10)}</small></div>
          <h4>{entry.name}</h4>
          <p>{entry.faction}{entry.character.subFaction ? `・${entry.character.subFaction}` : ""} · {entry.rank}</p>
          <em>{entry.character.skills.length} 特技 · {entry.character.ninpoIds.length} 忍法</em>
          <div><button onClick={() => loadCharacterFromLibrary(entry)}>作为 PC 加入</button><button className="library-remove" onClick={() => removeCharacterFromLibrary(entry)}>移除</button></div>
        </article>)}
      </div> : <p className="empty-log library-empty">还没有保存的角色。完成一次导入或车卡后，点击“保存当前角色”。</p>}
    </section>
  );
}
