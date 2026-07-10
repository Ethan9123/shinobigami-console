import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og-v04.png`;

  return {
    title: "忍神控制台",
    description: "从开团公告、秘密交付与角色卡复核，到场景巡次、情报共享和攻击结算的一体化《忍神》跑团辅助工具。",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "忍神控制台",
      description: "开团、场景、结算，一处掌控。",
      type: "website",
      images: [{ url: imageUrl, width: 1730, height: 909, alt: "忍神控制台 v0.4" }],
    },
    twitter: { card: "summary_large_image", title: "忍神控制台", description: "开团、场景、结算，一处掌控。", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
