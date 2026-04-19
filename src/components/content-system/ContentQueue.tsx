"use client";

import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import { setSyncedItem } from '@/lib/storage';
import { SYNC_KEYS } from '@/lib/sync-keys';
import type { BusinessChannel, ContentIdea } from '@/types/business';
import { Text, SectionTitle } from '../ui/Text';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

export function ContentQueue() {
  const channels = useStorageSubscription<BusinessChannel[]>(SYNC_KEYS.FINANCES_BUSINESS, []);
  const ideas = useStorageSubscription<ContentIdea[]>(SYNC_KEYS.FINANCES_BUSINESS_IDEAS, []);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [newIdeaTexts, setNewIdeaTexts] = useState<Record<string, string>>({});
  const [expandedChannels, setExpandedChannels] = useState<Record<string, boolean>>({});
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (channels.length > 0 && !isLoaded) {
      const initialExpanded: Record<string, boolean> = {};
      channels.filter(c => c.status === 'Active').forEach(c => { initialExpanded[c.id] = true; });
      setExpandedChannels(initialExpanded);
      setIsLoaded(true);
    }
  }, [channels, isLoaded]);

  const addIdea = (channelId: string) => {
    const text = newIdeaTexts[channelId];
    if (!text?.trim()) return;

    const newIdea: ContentIdea = {
      id: crypto.randomUUID(),
      channelId,
      title: text,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS_IDEAS, JSON.stringify([newIdea, ...ideas]));
    setNewIdeaTexts({ ...newIdeaTexts, [channelId]: '' });
  };

  const toggleIdeaStatus = (id: string) => {
    const updated = ideas.map(idea => idea.id === id ? { ...idea, status: (idea.status === 'Pending' ? 'Completed' : 'Pending') as any } : idea);
    setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS_IDEAS, JSON.stringify(updated));
  };

  const deleteIdea = (id: string) => {
    setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS_IDEAS, JSON.stringify(ideas.filter(i => i.id !== id)));
  };

  const toggleChannel = (id: string) => {
    setExpandedChannels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const activeChannels = channels.filter(c => c.status === 'Active');

  return (
    <section className="w-full mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
        <div>
          <SectionTitle>Content queue</SectionTitle>
          <Text variant="label" className="mt-1">Ready-to-use ideas to keep your execution consistent</Text>
        </div>
        <button onClick={() => setShowCompleted(!showCompleted)} className={`text-xs uppercase font-bold px-4 py-2 rounded-xl border transition-all ${ showCompleted ? 'bg-rose-50 text-rose-600 border-rose-100' : 'text-zinc-500 border-zinc-200' }`}>
          {showCompleted ? 'Hide Completed' : 'Show Completed'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeChannels.map(channel => {
          const channelIdeas = ideas.filter(i => i.channelId === channel.id && (showCompleted || i.status === 'Pending'));
          const isExpanded = expandedChannels[channel.id];

          return (
            <div key={channel.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 rounded-2xl overflow-hidden flex flex-col shadow-sm transition-all duration-300">
              <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => toggleChannel(channel.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">{channel.name.charAt(0)}</div>
                  <div className="flex flex-col"><Text variant="body" className="font-bold">{channel.name}</Text><Text variant="label" className="text-[10px] font-bold uppercase">{channel.platform} • {channelIdeas.length} ideas</Text></div>
                </div>
                {isExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 flex flex-col gap-3">
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {channelIdeas.map(idea => (
                      <div key={idea.id} className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${ idea.status === 'Completed' ? 'opacity-50' : 'bg-white dark:bg-zinc-800 border-zinc-50' }`}>
                        <button onClick={() => toggleIdeaStatus(idea.id)} className={`mt-0.5 ${idea.status === 'Completed' ? 'text-emerald-500' : 'text-zinc-300'}`}>
                          {idea.status === 'Completed' ? <CheckCircle2 size={16}/> : <Circle size={16}/>}
                        </button>
                        <div className="flex-1 min-w-0"><Text variant="body" className={`text-xs font-bold leading-relaxed ${idea.status === 'Completed' ? 'line-through text-zinc-400' : ''}`}>{idea.title}</Text></div>
                        <button onClick={() => deleteIdea(idea.id)} className="text-zinc-400 hover:text-rose-500 px-1"><Trash2 size={12}/></button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input type="text" placeholder="Add an idea..." value={newIdeaTexts[channel.id] || ''} onChange={(e) => setNewIdeaTexts({...newIdeaTexts, [channel.id]: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && addIdea(channel.id)} className="flex-1 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none"/>
                    <button onClick={() => addIdea(channel.id)} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-2 rounded-xl"><Plus size={16}/></button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
