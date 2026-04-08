'use client';

import React from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { OneNoteAdvanced } from '@/components/widgets/OneNoteAdvanced';
import { NavigationBar } from '@/components/NavigationBar';

export default function OneNotePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-8 xl:px-12 py-12">
      <OneNoteAdvanced />
    </div>
  );
}
