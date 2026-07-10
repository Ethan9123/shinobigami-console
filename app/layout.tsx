import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "忍神控制台",
    description: "角色管理、2D6 判定、秘密布局与战斗记录一体化的《忍神》跑团辅助工具。",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "忍神控制台",
      description: "从秘密布局到忍法判定，一处完成团务战斗管理。",
      type: "website",
      images: [{ url: imageUrl, width: 1672, height: 941, alt: "忍神控制台" }],
    },
    twitter: { card: "summary_large_image", title: "忍神控制台", description: "秘密布局、2D6 判定与战斗记录工具。", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
