import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./components/tutorial/tutorial.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og-replay-v07.png`;

  return {
    title: "忍神控制台",
    description: "本地优先的《忍神》团务辅助工具：自动 Replay、张力曲线、角色工作台、场景导演与逐步战斗结算。",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "忍神控制台",
      description: "自动 Replay 工房 · 张力曲线 · 场景导演",
      type: "website",
      images: [{ url: imageUrl, width: 1727, height: 911, alt: "忍神控制台：自动 Replay 工房、张力曲线与场景导演" }],
    },
    twitter: { card: "summary_large_image", title: "忍神控制台", description: "自动 Replay 工房 · 张力曲线 · 场景导演", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
