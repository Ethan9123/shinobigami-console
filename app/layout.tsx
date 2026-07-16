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
    description: "本地优先的《忍神》团务辅助工具：角色工作台、场景与跑团记录导演、布局战斗和逐步结算。",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "忍神控制台",
      description: "角色工作台 · 场景导演 · 战斗结算",
      type: "website",
      images: [{ url: imageUrl, width: 1730, height: 909, alt: "忍神控制台：角色工作台、场景导演与战斗结算" }],
    },
    twitter: { card: "summary_large_image", title: "忍神控制台", description: "角色工作台 · 场景导演 · 战斗结算", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
