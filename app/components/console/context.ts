import { createContext, useContext } from "react";
import type { Character } from "../../lib/session";
import type { ConsoleController } from "./useConsoleController";

export type ConsoleView = "academy" | "tutorial" | "prep" | "battle" | "sheet" | "replay" | "director";

export const ConsoleContext = createContext<ConsoleController | null>(null);

export function useConsole(): ConsoleController {
  const controller = useContext(ConsoleContext);
  if (!controller) throw new Error("useConsole() must be called inside <ConsoleContext.Provider>.");
  return controller;
}

export type SelectedConsole = ConsoleController & { selected: Character };

function hasSelected(controller: ConsoleController): controller is SelectedConsole {
  return Boolean(controller.selected);
}

/** 需要当前角色的面板使用；ShinobigamiConsole 在渲染任何视图前已经挡掉了没有角色的情况。 */
export function useSelectedConsole(): SelectedConsole {
  const controller = useConsole();
  if (!hasSelected(controller)) throw new Error("useSelectedConsole() requires a selected character.");
  return controller;
}
