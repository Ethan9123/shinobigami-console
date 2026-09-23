import { makeDefaultHandouts } from "../../../lib/session";
import type { Handout, SessionBrief } from "../../../lib/session";
import type { ConsoleBase } from "../types";

export function createPrepActions(ctx: ConsoleBase) {
  const {
    addLog, brief, characters, checkpoint, handouts, prepBlockers, setBrief, setGmBeat, setGmPressure, setHandouts,
    setPhase, setView, updateCharacter,
  } = ctx;

  const updateBrief = (patch: Partial<SessionBrief>) => {
    setBrief((current) => ({ ...current, ...patch }));
  };

  const updateRequirements = (patch: Partial<SessionBrief["requirements"]>) => {
    setBrief((current) => ({ ...current, requirements: { ...current.requirements, ...patch } }));
  };

  const resizeHandouts = () => {
    checkpoint();
    const generated = makeDefaultHandouts(characters, brief.playerCount);
    setHandouts(generated.map((fresh, index) => ({ ...fresh, ...(handouts[index] ?? {}), id: handouts[index]?.id ?? fresh.id, slot: fresh.slot })));
    addLog(`已按公告人数整理为 ${brief.playerCount} 份 PC 位。`, "system");
  };

  const updateHandout = (id: string, patch: Partial<Handout>) => {
    setHandouts((items) => items.map((handout) => handout.id === id ? { ...handout, ...patch } : handout));
  };

  const applyHandoutToCharacter = (handout: Handout) => {
    const character = characters.find((item) => item.id === handout.assignedCharacterId);
    if (!character) {
      addLog(`${handout.slot} 尚未分配角色，无法同步。`, "danger");
      return;
    }
    checkpoint();
    updateCharacter(character.id, {
      mission: handout.publicMission.trim() || character.mission,
      secret: handout.privateSecret.trim() || character.secret,
    });
    addLog(`已将 ${handout.slot} 的使命与秘密同步给 ${character.name}。`, "system");
  };

  const startSession = () => {
    if (prepBlockers.length) {
      addLog(`开团门禁未通过：仍有 ${prepBlockers.length} 项必须确认。`, "danger");
      return;
    }
    checkpoint();
    setPhase("主要");
    setView("director");
    setGmBeat("定调");
    setGmPressure(1);
    addLog(`《${brief.title}》开团检查完成，进入主要阶段。`, "system");
  };

  return {
    updateBrief, updateRequirements, resizeHandouts, updateHandout, applyHandoutToCharacter, startSession,
  };
}

export type PrepActions = ReturnType<typeof createPrepActions>;
