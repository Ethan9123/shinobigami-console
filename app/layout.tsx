import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./components/tutorial/tutorial.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "忍神控制台",
    description: "本地优先的《忍神》团务辅助工具：熟练 GM 导演席、自动 Replay、场景节拍、失败推进，以及 BCDice、CCFOLIA 与 Foundry VTT 互通。",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "忍神控制台",
      description: "熟练 GM 导演席 · 自动 Replay · 失败也前进",
      type: "website",
      images: [{ url: imageUrl, width: 1729, height: 910, alt: "忍神控制台：熟练 GM 导演席与自动 Replay 工房" }],
    },
    twitter: { card: "summary_large_image", title: "忍神控制台", description: "熟练 GM 导演席 · 自动 Replay · 失败也前进", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
