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
    description: "本地优先的《忍神》团务辅助工具：场景牌桌、局势神谕、镜头账本、熟练 GM 导演席、自动 Replay，以及开源团务互通。",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "忍神控制台",
      description: "场景牌桌 · 局势神谕 · 镜头账本 · 自动 Replay",
      type: "website",
      images: [{ url: imageUrl, width: 1536, height: 1024, alt: "忍神控制台：场景牌桌、局势神谕与熟练 GM 导演席" }],
    },
    twitter: { card: "summary_large_image", title: "忍神控制台", description: "场景牌桌 · 局势神谕 · 镜头账本", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
