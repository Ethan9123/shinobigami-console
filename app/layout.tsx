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
    description: "无需主持人或规则预习，从安全约定、角色与秘密、两巡调查到高潮战斗，完整跑完第一次《忍神》忍务。",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "忍神控制台",
      description: "从零开始，跑完第一次忍务。",
      type: "website",
      images: [{ url: imageUrl, width: 1730, height: 909, alt: "忍神控制台：从零开始，跑完第一次忍务" }],
    },
    twitter: { card: "summary_large_image", title: "忍神控制台", description: "从零开始，跑完第一次忍务。", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
