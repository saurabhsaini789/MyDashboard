"use client";

import React from 'react';
import { ContentDashboard } from '@/components/content-system/ContentDashboard';
import { PageTitle, Description } from '@/components/ui/Text';

export default function ContentSystemPage() {
  return (
    <main className="min-h-screen bg-[#fcfcfc] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/10 p-4 md:p-8 xl:p-12 pb-32 relative overflow-hidden">
      <div className="mx-auto w-full max-w-7xl relative z-10">
        <header className="mb-10 flex flex-col items-start">
          <PageTitle>Content System</PageTitle>
          <Description>Manage your content operations, channels and strategy</Description>
        </header>

        <div className="fade-in" style={{ animationDelay: '0.2s' }}>
          <ContentDashboard />
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />
    </main>
  );
}
