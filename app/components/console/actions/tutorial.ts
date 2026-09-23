import { uid } from "../../../lib/rules";
import { makeDefaultHandouts } from "../../../lib/session";
import type { Character, SessionBrief } from "../../../lib/session";
import { RAIN_ZERO_LINE, getTutorialStep } from "../../../lib/tutorial";
import type { TutorialState } from "../../../lib/tutorial";
import type { ConsoleBase } from "../types";

export function createTutorialActions(ctx: ConsoleBase) {
  const {
    addLog, checkpoint, setCycle, setGame, setGmBeat, setGmPressure, setLastRoll, setPhase, setRevealed,
    setTableSafe, setTargetId, setTutorial, setView,
  } = ctx;

  const startTutorial = (next: TutorialState) => {
    checkpoint();
    const tutorialCharacters = RAIN_ZERO_LINE.characters.map(({ character }) => JSON.parse(JSON.stringify(character)) as Character);
    const hero = tutorialCharacters.find((character) => character.id === RAIN_ZERO_LINE.setup.heroId) ?? tutorialCharacters[0];
    const enemy = tutorialCharacters.find((character) => character.id === RAIN_ZERO_LINE.setup.enemyId) ?? tutorialCharacters[1];
    const tutorialBrief: SessionBrief = {
      title: RAIN_ZERO_LINE.meta.title,
      regulation: "现代篇",
      scenarioType: "协力型（原创单人教学变体）",
      playerCount: 1,
      cycles: RAIN_ZERO_LINE.meta.cycles,
      rank: "中忍",
      characterMode: "新卡",
      gmDifficulty: "系统引导",
      allowedRules: "基本规则概念；不使用背景、下位流派或扩展规则",
      submissionDeadline: "",
      requirements: { requiredSkills: 6, requiredNinpoSlots: 3, requiredTools: 3 },
    };
    const tutorialHandouts = makeDefaultHandouts(tutorialCharacters, 1).map((handout) => ({
      ...handout,
      assignedCharacterId: hero.id,
      publicMission: hero.mission,
      privateSecret: hero.secret,
      recommendedFaction: hero.faction,
      delivered: true,
      reviewed: true,
      questionsResolved: true,
    }));
    setGame({
      schemaVersion: 9,
      characters: tutorialCharacters,
      selectedId: hero.id,
      round: 1,
      revealed: false,
      logs: [{ id: uid("log"), round: 1, cycle: 1, tone: "system", text: "原创教学忍务《雨夜零号线》已载入。系统将扮演主持人与 NPC。" }],
      phase: "导入",
      turnIndex: 0,
      customNinpo: [],
      cycle: 1,
      sceneNumber: 1,
      sceneOwnerId: hero.id,
      sceneParticipantIds: [hero.id],
      sceneAction: "未定",
      sceneNote: "",
      emotions: [],
      intel: [],
      cues: [
        { id: "rain-zero-cue-roof", title: "无面车掌带着白狐匣登上车顶", cycle: 2, scene: 2, done: false },
        { id: "rain-zero-cue-ending", title: "公开白狐匣的最后真相", cycle: 2, scene: 3, done: false },
      ],
      trackers: [{ id: "rain-zero-terminal", name: "距离终点", value: 0, max: 3 }],
      treasures: [],
      brief: tutorialBrief,
      handouts: tutorialHandouts,
      resolution: null,
      tutorial: next,
      transcript: null,
      replay: null,
    });
    setTargetId(enemy.id);
    setTableSafe(false);
    setGmBeat("定调");
    setGmPressure(1);
    setView("tutorial");
    setLastRoll(null);
  };

  const changeTutorial = (next: TutorialState, eventText?: string) => {
    setTutorial(next);
    const nextStep = getTutorialStep(next);
    if (nextStep?.phase === "导入" || nextStep?.phase === "主要" || nextStep?.phase === "高潮") setPhase(nextStep.phase);
    if (nextStep?.id.startsWith("cycle-2")) setCycle(2);
    if (nextStep?.id === "climax-battle") setRevealed(true);
    if (eventText) addLog(eventText, eventText.includes("失败") || eventText.includes("暂停") ? "danger" : "action");
  };

  return {
    startTutorial, changeTutorial,
  };
}

export type TutorialActions = ReturnType<typeof createTutorialActions>;
