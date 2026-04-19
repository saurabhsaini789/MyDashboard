"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Info, CheckCircle2, LayoutGrid, List } from 'lucide-react';
import confetti from 'canvas-confetti';
import { setSyncedItem } from '@/lib/storage';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';
import { DEFAULT_PLATFORMS, CONTENT_TYPES, type BusinessChannel, type ContentIdea } from '@/types/business';
import { Text, SectionTitle } from '../ui/Text';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

export function BusinessChannelsSection() {
  const channels = useStorageSubscription<BusinessChannel[]>(SYNC_KEYS.FINANCES_BUSINESS, []);
  const ideas = useStorageSubscription<ContentIdea[]>(SYNC_KEYS.FINANCES_BUSINESS_IDEAS, []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<BusinessChannel | null>(null);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [selectedChannelForPost, setSelectedChannelForPost] = useState<string | null>(null);
  const viewMode = useStorageSubscription<'table' | 'grid'>('content_system_view_mode', 'table');
  
  const [formData, setFormData] = useState({
    name: '', platform: 'Instagram', customPlatform: '', contentType: 'Posts', customContentType: '', status: 'Active' as any, postingFrequency: 1, lastPostedDate: new Date().toISOString().split('T')[0], rowColor: '', about: ''
  });

  const LIGHT_COLORS = [
    { name: 'Default', value: '', dot: 'bg-zinc-200' },
    { name: 'Rose', value: 'bg-rose-50', dot: 'bg-rose-500' },
    { name: 'Amber', value: 'bg-amber-50', dot: 'bg-amber-500' },
    { name: 'Emerald', value: 'bg-emerald-50', dot: 'bg-emerald-500' },
    { name: 'Sky', value: 'bg-sky-50', dot: 'bg-sky-500' },
    { name: 'Indigo', value: 'bg-indigo-50', dot: 'bg-indigo-500' },
    { name: 'Violet', value: 'bg-violet-50', dot: 'bg-violet-500' },
    { name: 'Zinc', value: 'bg-zinc-50', dot: 'bg-zinc-500' },
  ];

  useEffect(() => {
    // Component mount logic
  }, []);

  const toggleViewMode = (mode: 'table' | 'grid') => { setSyncedItem('content_system_view_mode', mode); };

  const openAddModal = () => {
    setEditingChannel(null);
    setFormData({ name: '', platform: 'Instagram', customPlatform: '', contentType: 'Posts', customContentType: '', status: 'Active', postingFrequency: 1, lastPostedDate: new Date().toISOString().split('T')[0], rowColor: '', about: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (channel: BusinessChannel) => {
    setEditingChannel(channel);
    const isStandardPlatform = DEFAULT_PLATFORMS.includes(channel.platform);
    const isStandardType = CONTENT_TYPES.includes(channel.contentType || '');
    setFormData({
      name: channel.name, platform: isStandardPlatform ? channel.platform : 'Other', customPlatform: isStandardPlatform ? '' : channel.platform,
      contentType: isStandardType ? (channel.contentType || 'Posts') : 'Other', customContentType: isStandardType ? '' : (channel.contentType || ''),
      status: channel.status, postingFrequency: channel.postingFrequency, lastPostedDate: channel.lastPostedDate, rowColor: channel.rowColor || '', about: channel.about || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const platform = formData.platform === 'Other' ? formData.customPlatform : formData.platform;
    const contentType = formData.contentType === 'Other' ? formData.customContentType : formData.contentType;
    const nextDate = new Date(formData.lastPostedDate);
    nextDate.setDate(nextDate.getDate() + formData.postingFrequency);

    const newItem: BusinessChannel = {
      id: editingChannel ? editingChannel.id : crypto.randomUUID(),
      name: formData.name, platform: platform || 'Other', contentType: contentType || 'Other', status: formData.status,
      postingFrequency: formData.postingFrequency, lastPostedDate: formData.lastPostedDate, nextPostDueDate: nextDate.toISOString().split('T')[0],
      rowColor: formData.rowColor, about: formData.about
    };

    const updated = editingChannel ? channels.map(c => c.id === editingChannel.id ? newItem : c) : [newItem, ...channels];
    setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS, JSON.stringify(updated));
    setIsModalOpen(false);
  };

  const markAsPosted = (id: string, ideaId?: string) => {
    if (!ideaId) {
      if (ideas.filter(i => i.channelId === id && i.status === 'Pending').length > 0) {
        setSelectedChannelForPost(id); setIsIdeaModalOpen(true); return;
      }
    }
    const today = new Date().toISOString().split('T')[0];
    const updatedChannels = channels.map(c => {
      if (c.id === id) {
        const next = new Date(); next.setDate(next.getDate() + c.postingFrequency);
        return { ...c, lastPostedDate: today, nextPostDueDate: next.toISOString().split('T')[0] };
      }
      return c;
    });
    if (ideaId && ideaId !== 'none') {
      const updatedIdeas = ideas.map(i => i.id === ideaId ? { ...i, status: 'Completed' as any } : i);
      setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS_IDEAS, JSON.stringify(updatedIdeas));
    }
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS, JSON.stringify(updatedChannels));
    setIsIdeaModalOpen(false);
  };

  const getStatus = (c: BusinessChannel) => {
    if (c.status !== 'Active') return { l: 'Draft', c: 'text-zinc-400' };
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(c.nextPostDueDate || ''); due.setHours(0,0,0,0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return { l: 'Overdue', c: 'text-rose-500' };
    if (diff <= 1) return { l: 'Due Soon', c: 'text-amber-500' };
    return { l: 'On Track', c: 'text-emerald-500' };
  };

  return (
    <section className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
        <div><SectionTitle>Content System</SectionTitle><Text variant="label" className="mt-1">The central database and control layer of your content empire</Text></div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl h-[54px]">
            <button onClick={()=>toggleViewMode('table')} className={`px-4 rounded-xl text-xs font-bold ${viewMode==='table'?'bg-white shadow-sm':'text-zinc-400'}`}><List size={16}/></button>
            <button onClick={()=>toggleViewMode('grid')} className={`px-4 rounded-xl text-xs font-bold ${viewMode==='grid'?'bg-white shadow-sm':'text-zinc-400'}`}><LayoutGrid size={16}/></button>
          </div>
          <button onClick={openAddModal} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold px-6 h-[54px] rounded-2xl shadow-sm">+ NEW CHANNEL</button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-[10px] font-bold uppercase text-zinc-400">
              <tr><th className="px-6 py-4">Status</th><th className="px-6 py-4">Channel</th><th className="px-6 py-4">Platform</th><th className="px-6 py-4">Frequency</th><th className="px-6 py-4">Next Due</th><th className="px-6 py-4"></th></tr>
            </thead>
            <tbody className="text-sm font-bold">
              {channels.map(c => {
                const s = getStatus(c);
                return (
                  <tr key={c.id} className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50">
                    <td className="px-6 py-4"><span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${s.c} bg-zinc-50`}>{s.l}</span></td>
                    <td className="px-6 py-4">{c.name}</td>
                    <td className="px-6 py-4 text-zinc-400">{c.platform}</td>
                    <td className="px-6 py-4 text-center">{c.postingFrequency}d</td>
                    <td className="px-6 py-4"><span className={s.l==='Overdue'?'text-rose-500':''}>{new Date(c.nextPostDueDate||'').toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span></td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      {c.status==='Active' && <button onClick={()=>markAsPosted(c.id)} className="p-2 bg-zinc-900 text-white rounded-xl"><CheckCircle2 size={14}/></button>}
                      <button onClick={()=>openEditModal(c)} className="p-2 bg-zinc-100 rounded-xl text-zinc-400"><Edit2 size={14}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map(c => {
            const s = getStatus(c);
            return (
              <div key={c.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 rounded-2xl shadow-sm hover:-translate-y-1 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div><Text variant="body" className="font-bold text-lg">{c.name}</Text><span className="text-[10px] font-bold uppercase text-zinc-400">{c.platform}</span></div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${s.c} bg-zinc-50`}>{s.l}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-zinc-50 text-xs font-bold">
                  <div><span className="text-zinc-400">FREQ</span><div>{c.postingFrequency}d</div></div>
                  <div className="text-right"><span className="text-zinc-400">DUE</span><div className={s.l==='Overdue'?'text-rose-500':''}>{new Date(c.nextPostDueDate||'').toLocaleDateString(undefined, {month:'short', day:'numeric'})}</div></div>
                </div>
                <div className="flex gap-2 mt-4">
                  {c.status==='Active' && <button onClick={()=>markAsPosted(c.id)} className="flex-1 bg-zinc-900 text-white py-3 rounded-xl font-bold text-xs">POSTED</button>}
                  <button onClick={()=>openEditModal(c)} className="p-3 bg-zinc-100 rounded-xl text-zinc-400"><Edit2 size={16}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} title="Channel Record" onSubmit={handleSubmit}>
        <DynamicForm
          sections={[{ id:'c', fields:[
            { name:'name', label:'Name', type:'text', required:true, fullWidth:true },
            { name:'platform', label:'Platform', type:'select', options:DEFAULT_PLATFORMS.map(p=>({label:p,value:p})) },
            { name:'postingFrequency', label:'Freq (Days)', type:'number', required:true },
            { name:'lastPostedDate', label:'Last Post', type:'date', required:true },
            { name:'about', label:'Description', type:'textarea', fullWidth:true }
          ]}]}
          formData={formData}
          onChange={(n,v)=>setFormData(p=>({...p,[n]:v}))}
        />
        <div className="flex gap-2 mt-4">
          {['Active', 'Paused', 'Idea'].map(s => <button key={s} type="button" onClick={()=>setFormData({...formData, status:s as any})} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${formData.status===s?'bg-zinc-900 text-white':'bg-zinc-50 text-zinc-400'}`}>{s}</button>)}
        </div>
        {editingChannel && <button type="button" onClick={()=>setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS, JSON.stringify(channels.filter(c=>c.id!==editingChannel.id)))} className="mt-4 text-[10px] font-bold text-rose-500 uppercase">Delete Channel</button>}
      </Modal>

      <Modal isOpen={isIdeaModalOpen} onClose={()=>setIsIdeaModalOpen(false)} title="Select Idea">
        <div className="space-y-3">
          {ideas.filter(i => i.channelId === selectedChannelForPost && i.status === 'Pending').map(i => (
            <button key={i.id} onClick={()=>markAsPosted(selectedChannelForPost!, i.id)} className="w-full p-4 rounded-xl border hover:border-emerald-500 transition-all text-sm font-bold text-left">{i.title}</button>
          ))}
          <button onClick={()=>markAsPosted(selectedChannelForPost!, 'none')} className="w-full p-4 rounded-xl border border-dashed text-zinc-400 text-xs font-bold">Post without idea</button>
        </div>
      </Modal>
    </section>
  );
}
