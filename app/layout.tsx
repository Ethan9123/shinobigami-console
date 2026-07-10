import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og-v03.png`;

  return {
    title: "忍神控制台",
    description: "场景巡次、人物关系、情报共享、精确判定与秘密布局一体化的《忍神》跑团辅助工具。",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "忍神控制台",
      description: "场景、情报、判定，一处掌控。",
      type: "website",
      images: [{ url: imageUrl, width: 1730, height: 909, alt: "忍神控制台 v0.3" }],
    },
    twitter: { card: "summary_large_image", title: "忍神控制台", description: "场景、情报、判定，一处掌控。", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
