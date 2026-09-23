import { createBattleActions, createCheckPanelActions } from "./actions/battle";
import { createDirectorActions } from "./actions/director";
import { createPrepActions } from "./actions/prep";
import { createReplayActions } from "./actions/replay";
import { createRosterActions } from "./actions/roster";
import { createSessionActions } from "./actions/session";
import { createSheetActions } from "./actions/sheet";
import { createTutorialActions } from "./actions/tutorial";
import { useGameStore } from "./store/useGameStore";
import { useConsoleDerived } from "./useConsoleDerived";
import { useConsoleRefs, useConsoleUi } from "./useConsoleUi";

export function useConsoleController() {
  const store = useGameStore();
  const ui = useConsoleUi();
  const refs = useConsoleRefs();
  const derived = useConsoleDerived({ ...store, ...ui });
  const base = { ...store, ...ui, ...derived };

  // 创建顺序即依赖顺序：后面的领域可以直接调用前面领域的处理函数（如 selectCharacter → resetCheckPanel）
  const checkPanelActions = createCheckPanelActions(base);
  const rosterActions = createRosterActions({ ...base, ...checkPanelActions });
  const battleActions = createBattleActions({ ...base, ...checkPanelActions, ...rosterActions });
  const prepActions = createPrepActions(base);
  const directorActions = createDirectorActions({ ...base, ...rosterActions, ...battleActions });
  const sheetActions = createSheetActions({ ...base, ...rosterActions, ...battleActions });
  const replayActions = createReplayActions(base);
  const tutorialActions = createTutorialActions(base);
  const sessionActions = createSessionActions(base);

  return {
    ...base,
    ...refs,
    ...checkPanelActions,
    ...rosterActions,
    ...battleActions,
    ...prepActions,
    ...directorActions,
    ...sheetActions,
    ...replayActions,
    ...tutorialActions,
    ...sessionActions,
  };
}

export type ConsoleController = ReturnType<typeof useConsoleController>;
