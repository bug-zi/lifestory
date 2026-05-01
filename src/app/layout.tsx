import type { Metadata } from "next";
import { Geist, Geist_Mono, Ma_Shan_Zheng, Noto_Serif_SC } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { NavBar } from "@/components/NavBar";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const maShanZheng = Ma_Shan_Zheng({
  variable: "--font-calligraphy",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "人生副本 — 你想活出怎样的人生",
  description:
    "每天体验一段截然不同的人生。从500份精选人生副本中，发现你从未想象过的可能。",
  icons: {
    icon: "/images/lifestory.png",
    apple: "/images/lifestory.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSerifSC.variable} ${maShanZheng.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('reading-font-settings')||'{}');var f={"noto-serif-sc":'"Noto Serif SC", "PingFang SC", serif',"ma-shan-zheng":'"Ma Shan Zheng", cursive',"system-serif":'"PingFang SC", "Microsoft YaHei", serif',"system-sans":'"PingFang SC", "Microsoft YaHei", sans-serif'};var r=document.documentElement.style;r.setProperty('--reading-font-family',f[s.family]||f["noto-serif-sc"]);r.setProperty('--reading-font-size',(s.size||16)+'px');r.setProperty('--reading-font-weight',(s.weight||400));}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <NavBar />
            <main className="flex-1">{children}</main>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
