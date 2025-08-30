import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LLMセキュリティ評価システム",
  description: "AI言語モデルの包括的セキュリティ評価プラットフォーム",
  keywords: ["LLM", "セキュリティ", "AI", "評価", "コンプライアンス"],
  authors: [{ name: "LLM Security Assessment Team" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          jetbrainsMono.variable,
          "min-h-screen bg-background font-sans antialiased"
        )}
      >
        <ThemeProvider
          defaultTheme="system"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
