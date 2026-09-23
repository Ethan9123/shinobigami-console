import type { Character } from "../../../../lib/session";
import { useSelectedConsole } from "../../context";
import { RANK_OPTIONS } from "../../shared";

export default function Dossier() {
  const { importPortrait, portraitRef, selected, tableSafe, updateCharacter } = useSelectedConsole();

  return (
    <>
      <div className="character-dossier">
        <div className="portrait-column">
          <button className={`portrait-frame ${selected.portrait ? "has-image" : ""}`} onClick={() => portraitRef.current?.click()} style={selected.portrait ? { backgroundImage: `url(${selected.portrait})` } : undefined}>
            {!selected.portrait && <><span>立绘</span><b>{selected.name.slice(0, 2)}</b><em>选择本地图片</em></>}
          </button>
          <input ref={portraitRef} type="file" accept="image/*" onChange={importPortrait} hidden />
          {selected.portrait && <button className="remove-portrait" onClick={() => updateCharacter(selected.id, { portrait: "" })}>移除立绘</button>}
          <div className="dossier-stamp"><span>{selected.role}</span><strong>{selected.belief || "信念未定"}</strong><em>功绩点 {selected.merit ?? 0}</em></div>
        </div>
        <div className="identity-grid expanded">
          <label className="name-field">角色名<input value={selected.name} onChange={(event) => updateCharacter(selected.id, { name: event.target.value })} /></label>
          <label>玩家<input value={selected.player ?? ""} onChange={(event) => updateCharacter(selected.id, { player: event.target.value })} /></label>
          <label>流派<input value={selected.faction} onChange={(event) => updateCharacter(selected.id, { faction: event.target.value })} /></label>
          <label>下位流派<input value={selected.subFaction ?? ""} onChange={(event) => updateCharacter(selected.id, { subFaction: event.target.value })} placeholder="如无可留空" /></label>
          <label>阶级<select value={selected.rank} onChange={(event) => updateCharacter(selected.id, { rank: event.target.value })}><option value="草">草（NPC 用）</option>{RANK_OPTIONS.map((rank) => <option key={rank} value={rank}>{rank}</option>)}{selected.rank && selected.rank !== "草" && !RANK_OPTIONS.includes(selected.rank) && <option value={selected.rank}>{selected.rank}（导入值）</option>}</select></label>
          <label>习得条件<input value={selected.condition ?? ""} onChange={(event) => updateCharacter(selected.id, { condition: event.target.value })} placeholder="条件" /></label>
          <label>流仪<input value={selected.style ?? ""} onChange={(event) => updateCharacter(selected.id, { style: event.target.value })} /></label>
          <label>年龄<input value={selected.age ?? ""} onChange={(event) => updateCharacter(selected.id, { age: event.target.value })} /></label>
          <label>性别<input value={selected.gender ?? ""} onChange={(event) => updateCharacter(selected.id, { gender: event.target.value })} /></label>
          <label>表之颜<input value={selected.cover ?? ""} onChange={(event) => updateCharacter(selected.id, { cover: event.target.value })} /></label>
          <label>信念<input value={selected.belief ?? ""} onChange={(event) => updateCharacter(selected.id, { belief: event.target.value })} /></label>
          <label>仇敌<input value={selected.enemy ?? ""} onChange={(event) => updateCharacter(selected.id, { enemy: event.target.value })} /></label>
          <label>功绩点<input type="number" value={selected.merit ?? 0} onChange={(event) => updateCharacter(selected.id, { merit: Number(event.target.value) })} /></label>
          <label>类型<select value={selected.role} onChange={(event) => updateCharacter(selected.id, { role: event.target.value as Character["role"] })}><option value="PC">PC</option><option value="NPC">NPC</option></select></label>
        </div>
      </div>
      <div className="narrative-grid expanded-narrative">
        <label>使命<textarea value={selected.mission} onChange={(event) => updateCharacter(selected.id, { mission: event.target.value })} /></label>
        <label className={tableSafe ? "masked-field" : ""}>秘密<textarea value={tableSafe ? "桌面安全模式：秘密已隐藏" : selected.secret} disabled={tableSafe} onChange={(event) => updateCharacter(selected.id, { secret: event.target.value })} /></label>
        <label>人物故事<textarea value={selected.story ?? ""} onChange={(event) => updateCharacter(selected.id, { story: event.target.value })} placeholder="外表、性格、经历与角色钩子" /></label>
        <label>背景<textarea value={selected.backgrounds ?? ""} onChange={(event) => updateCharacter(selected.id, { backgrounds: event.target.value })} placeholder="每行一个背景，可写类型与效果摘要" /></label>
      </div>
    </>
  );
}
