import { makeLife, uid } from "../../../lib/rules";
import type { Ninpo } from "../../../lib/rules";
import type { Character } from "../../../lib/session";
import type { ConsoleBase } from "../types";
import type { CheckPanelActions } from "./battle";

export function createRosterActions(ctx: ConsoleBase & CheckPanelActions) {
  const {
    addLog, characters, checkpoint, emotionFromId, emotionToId, intelReceiverId, intelSubjectId, replayHeroId,
    resetCheckPanel, resolution, sceneOwnerId, selected, selectedId, setCharacters, setEmotionFromId, setEmotionToId,
    setEmotions, setHandouts, setIntel, setIntelReceiverId, setIntelSubjectId, setReplayHeroId, setResolution,
    setSceneOwnerId, setSceneParticipantIds, setSelectedId, setTreasures, updateCharacter,
  } = ctx;

  const selectCharacter = (id: string) => {
    if (id !== selectedId) resetCheckPanel();
    setSelectedId(id);
  };

  const setNinpoSkill = (character: Character, ninpo: Ninpo, skill: string) => {
    checkpoint();
    const ninpoSkills = { ...(character.ninpoSkills ?? {}) };
    if (skill) ninpoSkills[ninpo.id] = skill;
    else delete ninpoSkills[ninpo.id];
    updateCharacter(character.id, { ninpoSkills });
    addLog(skill ? `${character.name} 的【${ninpo.name}】指定特技定为《${skill}》。` : `${character.name} 的【${ninpo.name}】已清除指定特技。`, "system");
  };

  const addCharacter = (role: "PC" | "NPC") => {
    checkpoint();
    const id = uid(role.toLowerCase());
    const character: Character = {
      id,
      name: role === "PC" ? `新忍者 ${characters.filter((c) => c.role === "PC").length + 1}` : `新敌人 ${characters.filter((c) => c.role === "NPC").length + 1}`,
      role, faction: "未选择流派", rank: "中忍", plot: null, active: true, extraLife: 0, life: makeLife(),
      skills: ["刀术"], ninpoIds: ["close", "shoot"], ninpoSkills: {}, conditions: [], paralyzedSkills: [], spentCost: 0, usedNinpoIds: [],
      mission: "", secret: "", ougi: "", closedGaps: [false, false, false, false, false], outerGapClosed: false, acted: false,
      player: "", age: "", gender: "", cover: "", belief: "", merit: 0, enemy: "", surface: "", story: "", backgrounds: "", backgroundItems: [], portrait: "",
      subFaction: "", condition: "", style: "",
      ougiSkill: "", ougiEffect: "", ougiStrength: "", ougiWeakness: "",
      tools: { 兵粮丸: 1, 神通丸: 1, 遁甲符: 0 },
    };
    setCharacters((items) => [...items, character]);
    selectCharacter(id);
    addLog(`${character.name} 已加入角色列表。`, "system");
  };

  const removeSelected = () => {
    if (!selected || characters.length <= 1) return;
    checkpoint();
    const remaining = characters.filter((character) => character.id !== selected.id);
    setCharacters(remaining);
    selectCharacter(remaining[0].id);
    setEmotions((items) => items.filter((emotion) => emotion.fromId !== selected.id && emotion.toId !== selected.id));
    setIntel((items) => items.filter((record) => record.subjectId !== selected.id).map((record) => ({ ...record, knownBy: record.knownBy.filter((id) => id !== selected.id) })));
    setHandouts((items) => items.map((handout) => handout.assignedCharacterId === selected.id ? { ...handout, assignedCharacterId: "", reviewed: false } : handout));
    setTreasures((items) => items.map((treasure) => treasure.holderId === selected.id ? { ...treasure, holderId: "" } : treasure));
    if (resolution?.actorId === selected.id || resolution?.targetId === selected.id) setResolution(null);
    setSceneParticipantIds((items) => items.filter((id) => id !== selected.id));
    if (sceneOwnerId === selected.id) setSceneOwnerId(remaining[0].id);
    if (emotionFromId === selected.id) setEmotionFromId(remaining[0].id);
    if (emotionToId === selected.id) setEmotionToId(remaining.find((item) => item.id !== remaining[0].id)?.id ?? remaining[0].id);
    if (intelReceiverId === selected.id) setIntelReceiverId(remaining[0].id);
    if (intelSubjectId === selected.id) setIntelSubjectId(remaining.find((item) => item.id !== remaining[0].id)?.id ?? remaining[0].id);
    if (replayHeroId === selected.id) setReplayHeroId(remaining.find((item) => item.role === "PC")?.id ?? remaining[0].id);
    addLog(`${selected.name} 已从控制台移除。`, "danger");
  };

  return {
    selectCharacter, setNinpoSkill, addCharacter, removeSelected,
  };
}

export type RosterActions = ReturnType<typeof createRosterActions>;
