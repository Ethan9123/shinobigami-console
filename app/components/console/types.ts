import type { GameStore } from "./store/useGameStore";
import type { ConsoleDerived } from "./useConsoleDerived";
import type { ConsoleUi } from "./useConsoleUi";

export type ConsoleBase = GameStore & ConsoleUi & ConsoleDerived;
