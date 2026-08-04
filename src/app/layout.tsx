import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./dark-mode.css"; // DARK MODE - Remove this line to revert
import { Providers } from "@/components/Providers";
import ThemeToggle from "@/components/ThemeToggle";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SwayamSutra — AI Regulatory Documentation Engine",
  description: "AI-based Regulatory Documentation Engine and Secure Compliance Vault for medical devices.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} data-theme="dark">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
        <ThemeToggle />
      </body>
    </html>
  );
}
