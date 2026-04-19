import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavigationBar } from "@/components/NavigationBar";
import { SyncManager } from "@/components/SyncManager";
import { AuthGuard } from "@/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Dashboard",
  description: "Personal OS and Productivity Dashboard",
};

import { Providers } from "@/components/Providers";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <Providers>
          <AuthGuard>
            <SyncManager />
            <NavigationBar />
            <div className="pb-24 md:pb-32 bg-zinc-50 dark:bg-zinc-950">
              {children}
            </div>
            <FloatingNavbar />
            
            <footer className="w-full flex justify-center pb-40 pt-8 border-t border-zinc-200/50 dark:border-zinc-800/50 mt-auto bg-zinc-50 dark:bg-zinc-950">
              {/* Note: ThemeToggle needs to be inside Providers if it uses theme context */}
              <ThemeToggle />
            </footer>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
