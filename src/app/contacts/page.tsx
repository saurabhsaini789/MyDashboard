"use client";

import React from 'react';
import { ContactsList } from '@/components/contacts/ContactsList';
import { PageTitle, Description } from '@/components/ui/Text';

export default function ContactsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30 font-sans p-4 md:p-8 xl:p-12 transition-colors duration-200">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-10 flex flex-col items-start">
          <PageTitle>Contacts</PageTitle>
          <Description>Your personal CRM — leads, clients, family, and everyone in between.</Description>
        </header>

        <section className="w-full relative fade-in">
          <ContactsList />
        </section>
      </div>
    </main>
  );
}
