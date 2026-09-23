import { createContext, useContext } from "react";
import type { ConsoleController } from "./useConsoleController";

export type ConsoleView = "academy" | "tutorial" | "prep" | "battle" | "sheet" | "replay" | "director";

export const ConsoleContext = createContext<ConsoleController | null>(null);

export function useConsole(): ConsoleController {
  const controller = useContext(ConsoleContext);
  if (!controller) throw new Error("useConsole() must be called inside <ConsoleContext.Provider>.");
  return controller;
}
