import type { Metadata } from "next";
import ShinobigamiConsole from "./components/ShinobigamiConsole";

export const metadata: Metadata = {
  title: "忍神控制台",
  description: "面向《忍神》跑团的角色、判定、布局与战斗辅助工具。",
};

export default function Home() {
  return <ShinobigamiConsole />;
}
