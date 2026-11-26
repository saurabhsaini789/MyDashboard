"use client";

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ContentIdea } from '@/types/business';
import type { Brand } from '@/lib/content-system';

interface Props {
  /** Unassigned ideas, in queue order. */
  ideas: ContentIdea[];
  /** Brands an idea can go to (active first, then drafts). */
  brands: Brand[];
  onAdd: (title: string) => void;
  onAssign: (ideaId: string, brandKey: string) => void;
  onDelete: (id: string) => void;
}

/** Ideas jotted down without a brand; each can be sent to a brand's queue later. */
export function IdeasInbox({ ideas, brands, onAdd, onAssign, onDelete }: Props) {
  const [draft, setDraft] = useState('');

  const submit = () => {
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft('');
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 sm:p-5 shadow-sm">
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Jot an idea now, pick the brand later"
          className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
        />
        <button type="button" onClick={submit} aria-label="Add idea to inbox" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3 rounded-xl">
          <Plus size={16} />
        </button>
      </div>
      {ideas.length > 0 ? (
        <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {ideas.map(idea => (
            <div key={idea.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 py-2.5">
              <span className="flex-1 min-w-0 basis-full sm:basis-auto text-sm font-medium text-zinc-700 dark:text-zinc-200">{idea.title}</span>
              <select
                value=""
                onChange={e => e.target.value && onAssign(idea.id, e.target.value)}
                aria-label={`Send ${idea.title} to a brand`}
                className="flex-1 sm:flex-none sm:w-48 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-300 outline-none"
              >
                <option value="">Send to brand…</option>
                {brands.map(b => <option key={b.key} value={b.key}>{b.name}</option>)}
              </select>
              <button type="button" onClick={() => onDelete(idea.id)} aria-label={`Delete idea ${idea.title}`} className="p-1.5 text-zinc-300 hover:text-rose-500">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[11px] font-medium text-zinc-400 px-1">Nothing waiting. Ideas sent to a brand join the end of its queue.</p>
      )}
    </div>
  );
}
