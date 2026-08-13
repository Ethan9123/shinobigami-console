import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./components/tutorial/tutorial.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og-v17.png`;

  return {
    title: "忍神控制台",
    description: "本地优先的《忍神》团务辅助工具：Excel 角色卡导入、本地角色库、场景牌桌、战斗结算与自动 Replay。",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "忍神控制台",
      description: "Excel 角色卡 · 本地角色库 · 一键加入会话",
      type: "website",
      images: [{ url: imageUrl, width: 1536, height: 1024, alt: "忍神控制台 v1.7：Excel 角色卡、本地角色库与会话控制台" }],
    },
    twitter: { card: "summary_large_image", title: "忍神控制台 v1.7", description: "Excel 角色卡 · 本地角色库 · 一键加入会话", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
