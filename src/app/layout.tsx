import React from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { NavigationBar } from "@/components/NavigationBar";
import { FloatingNavbar } from "@/components/FloatingNavbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <Providers>
          <NavigationBar />
          <div className="pb-24 md:pb-32 bg-zinc-50 dark:bg-zinc-950">
            {children}
          </div>
          <FloatingNavbar />
        </Providers>
      </body>
    </html>
  );
}
