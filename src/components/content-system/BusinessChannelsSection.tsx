"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Globe, 
  MoreVertical, 
  ChevronDown, 
  X,
  PlusCircle,
  MoreHorizontal,
  Info,
  CheckCircle2,
  Rocket,
  Circle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getPrefixedKey } from '@/lib/keys';
import { setSyncedItem } from '@/lib/storage';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';
import { DEFAULT_PLATFORMS, CONTENT_TYPES, type BusinessChannel, type ContentIdea } from '@/types/business';
import { Text, SectionTitle } from '../ui/Text';

export function BusinessChannelsSection() {
  const [channels, setChannels] = useState<BusinessChannel[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<BusinessChannel | null>(null);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [selectedChannelForPost, setSelectedChannelForPost] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    platform: 'Instagram',
    customPlatform: '',
    contentType: 'Posts',
    customContentType: '',
    status: 'Active' as 'Active' | 'Paused' | 'Idea',
    postingFrequency: 1,
    lastPostedDate: new Date().toISOString().split('T')[0],
    rowColor: ''
  });

  const LIGHT_COLORS = [
    { name: 'Default', value: '', dot: 'bg-zinc-200 dark:bg-zinc-700' },
    { name: 'Rose', value: 'bg-rose-50/50 dark:bg-rose-500/5', dot: 'bg-rose-500' },
    { name: 'Amber', value: 'bg-amber-50/50 dark:bg-amber-500/5', dot: 'bg-amber-500' },
    { name: 'Emerald', value: 'bg-emerald-50/50 dark:bg-emerald-500/5', dot: 'bg-emerald-500' },
    { name: 'Sky', value: 'bg-sky-50/50 dark:bg-sky-500/5', dot: 'bg-sky-500' },
    { name: 'Indigo', value: 'bg-indigo-50/50 dark:bg-indigo-500/5', dot: 'bg-indigo-500' },
    { name: 'Violet', value: 'bg-violet-50/50 dark:bg-violet-500/5', dot: 'bg-violet-500' },
    { name: 'Zinc', value: 'bg-zinc-50/50 dark:bg-zinc-500/5', dot: 'bg-zinc-500' },
  ];

  const getDotColor = (rowColorValue?: string) => {
    const color = LIGHT_COLORS.find(c => c.value === rowColorValue);
    return color?.dot || 'bg-zinc-200 dark:bg-zinc-700';
  };


  const channelsRef = useRef(channels);
  useEffect(() => {
    channelsRef.current = channels;
  }, [channels]);

  useEffect(() => {
    const saved = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_BUSINESS));
    if (saved) {
      try {
        setChannels(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse business data", e);
      }
    }
    setIsLoaded(true);

    const handleLocal = (e: any) => {
      if (e.detail && e.detail.key === SYNC_KEYS.FINANCES_BUSINESS) {
        const val = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_BUSINESS));
        if (val && val !== JSON.stringify(channelsRef.current)) {
          try { setChannels(JSON.parse(val)); } catch (e) {}
        }
      }
      if (e.detail && e.detail.key === SYNC_KEYS.FINANCES_BUSINESS_IDEAS) {
        const val = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_BUSINESS_IDEAS));
        if (val) {
          try { setIdeas(JSON.parse(val)); } catch (e) {}
        }
      }
    };

    // Initial load for ideas
    const savedIdeas = localStorage.getItem(getPrefixedKey(SYNC_KEYS.FINANCES_BUSINESS_IDEAS));
    if (savedIdeas) {
      try { setIdeas(JSON.parse(savedIdeas)); } catch (e) {}
    }

    window.addEventListener('local-storage-change', handleLocal);
    return () => window.removeEventListener('local-storage-change', handleLocal);
  }, []);

  const openAddModal = () => {
    setEditingChannel(null);
    setFormData({
      name: '',
      platform: 'Instagram',
      customPlatform: '',
      contentType: 'Posts',
      customContentType: '',
      status: 'Active',
      postingFrequency: 1,
      lastPostedDate: new Date().toISOString().split('T')[0],
      rowColor: ''
    });
    setIsModalOpen(true);
  };


  const openEditModal = (channel: BusinessChannel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      platform: DEFAULT_PLATFORMS.includes(channel.platform) ? channel.platform : 'Other',
      customPlatform: DEFAULT_PLATFORMS.includes(channel.platform) ? '' : channel.platform,
      contentType: CONTENT_TYPES.includes(channel.contentType || '') ? (channel.contentType || 'Posts') : 'Other',
      customContentType: CONTENT_TYPES.includes(channel.contentType || '') ? '' : (channel.contentType || ''),
      status: channel.status,
      postingFrequency: channel.postingFrequency,
      lastPostedDate: channel.lastPostedDate,
      rowColor: channel.rowColor || ''
    });
    setIsModalOpen(true);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const platform = formData.platform === 'Other' ? formData.customPlatform : formData.platform;
    const contentType = formData.contentType === 'Other' ? formData.customContentType : formData.contentType;
    const lastPostedDate = new Date(formData.lastPostedDate);
    const nextDueDate = new Date(lastPostedDate);
    nextDueDate.setDate(lastPostedDate.getDate() + formData.postingFrequency);

    const newChannel: BusinessChannel = {
      id: editingChannel ? editingChannel.id : crypto.randomUUID(),
      name: formData.name,
      platform: platform || 'Other',
      contentType: contentType || 'Other',
      status: formData.status,
      postingFrequency: formData.postingFrequency,
      lastPostedDate: formData.lastPostedDate,
      nextPostDueDate: nextDueDate.toISOString().split('T')[0],
      rowColor: formData.rowColor
    };

    let updatedChannels;
    if (editingChannel) {
      updatedChannels = channels.map(c => c.id === editingChannel.id ? newChannel : c);
    } else {
      updatedChannels = [newChannel, ...channels];
    }

    setChannels(updatedChannels);
    setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS, JSON.stringify(updatedChannels));
    setIsModalOpen(false);
  };


  const deleteChannel = (id: string) => {
    const updated = channels.filter(c => c.id !== id);
    setChannels(updated);
    setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS, JSON.stringify(updated));
    if (editingChannel?.id === id) setIsModalOpen(false);
  };

  const markAsPosted = (id: string, ideaId?: string) => {
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    
    // Check if we should show idea selection first
    if (!ideaId) {
      const channelIdeas = ideas.filter(i => i.channelId === id && i.status === 'Pending');
      if (channelIdeas.length > 0) {
        setSelectedChannelForPost(id);
        setIsIdeaModalOpen(true);
        return;
      }
    }

    const updatedChannels = channels.map(c => {
      if (c.id === id) {
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + c.postingFrequency);
        const nextDateISO = nextDate.toISOString().split('T')[0];
        
        return {
          ...c,
          lastPostedDate: todayISO,
          nextPostDueDate: nextDateISO
        };
      }
      return c;
    });

    // If an idea was selected, mark it as completed
    if (ideaId) {
      const updatedIdeas = ideas.map(idea => 
        idea.id === ideaId ? { ...idea, status: 'Completed' as const } : idea
      );
      setIdeas(updatedIdeas);
      setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS_IDEAS, JSON.stringify(updatedIdeas));
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b']
    });

    setChannels(updatedChannels);
    setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS, JSON.stringify(updatedChannels));
    setIsIdeaModalOpen(false);
    setSelectedChannelForPost(null);
  };

  const getStatusIndicator = (channel: BusinessChannel) => {
    if (channel.status !== 'Active') return { icon: <Circle size={10} className="fill-current text-zinc-400" />, label: 'Draft', color: 'text-zinc-400' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(channel.nextPostDueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { icon: <Circle size={10} className="fill-current text-rose-500" />, label: 'Overdue', color: 'text-rose-500', priority: 3 };
    if (diffDays <= 1) return { icon: <Circle size={10} className="fill-current text-amber-500" />, label: 'Due Soon', color: 'text-amber-500', priority: 2 };
    return { icon: <Circle size={10} className="fill-current text-emerald-500" />, label: 'On Track', color: 'text-emerald-500', priority: 1 };
  };

  const sortedChannels = [...channels].sort((a, b) => {
    const statusA = getStatusIndicator(a);
    const statusB = getStatusIndicator(b);
    
    // Idea/Paused at the bottom
    if (a.status === 'Active' && b.status !== 'Active') return -1;
    if (a.status !== 'Active' && b.status === 'Active') return 1;
    
    // Sort by priority (Overdue > Due Soon > On Track)
    return (statusB.priority || 0) - (statusA.priority || 0);
  });

  if (!isLoaded) return null;

  return (
    <section className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
        <div>
          <SectionTitle className="flex items-center gap-2">
            Channels / Content System
          </SectionTitle>
          <Text variant="label" as="p" className="mt-1">
            The central database and control layer of your content empire
          </Text>
        </div>

        
        <button 
          onClick={openAddModal}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold px-6 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-sm shadow-zinc-900/10 h-[54px] flex items-center gap-2"
        >
          <Plus size={16} />
          New Channel
        </button>
      </div>

      {/* Table View (Desktop) */}
      <div className="hidden lg:block bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <Text variant="label" as="th" className="px-6 py-6 font-semibold">Status</Text>
                <Text variant="label" as="th" className="px-6 py-6 font-semibold">Channel / Business Name</Text>
                <Text variant="label" as="th" className="px-6 py-6 font-semibold">Platform / Location</Text>
                <Text variant="label" as="th" className="px-6 py-6 font-semibold">Content / Category</Text>
                <Text variant="label" as="th" className="px-6 py-6 font-semibold text-center">Freq</Text>
                <Text variant="label" as="th" className="px-6 py-6 font-semibold text-center">Days Ago</Text>
                <Text variant="label" as="th" className="px-6 py-6 font-semibold text-right">Next Due</Text>
                <th className="px-6 py-6"></th>
              </tr>
            </thead>
            <tbody>
              {sortedChannels.length > 0 ? sortedChannels.map(channel => {
                const indicator = getStatusIndicator(channel);
                const lastPosted = new Date(channel.lastPostedDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysSince = Math.floor((today.getTime() - lastPosted.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <tr key={channel.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1">
                        <Text variant="label" as="span" className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold border ${ channel.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : channel.status === 'Paused' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700' }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${channel.status === 'Active' ? 'bg-emerald-500 animate-pulse' : channel.status === 'Paused' ? 'bg-amber-500' : 'bg-zinc-400'}`} />
                          {channel.status}
                        </Text>
                        {channel.status === 'Active' && (
                          <Text variant="label" as="span" className={`px-2 flex items-center gap-1.5 font-semibold ${indicator.color}`}>
                            {indicator.icon} {indicator.label}
                          </Text>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <Text variant="body" as="span" className="font-bold">
                          {channel.name}
                        </Text>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${getDotColor(channel.rowColor)}`} />
                        <Text variant="bodySmall" muted as="span" className="text-xs">
                          {channel.platform}
                        </Text>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <Text variant="label" as="span" className="px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800">
                        {channel.contentType || 'Mixed'}
                      </Text>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <Text variant="bodySmall" muted as="span" className="text-xs">

                        {channel.postingFrequency}d
                      </Text>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <Text variant="body" as="span" className={`text-xs font-semibold ${daysSince > channel.postingFrequency ? 'text-rose-500' : 'text-zinc-500'}`}>
                        {daysSince}d
                      </Text>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <Text variant="body" as="span" className={`text-sm font-semibold ${ indicator.label === 'Overdue' ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-300' }`}>
                          {channel.nextPostDueDate ? new Date(channel.nextPostDueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Date'}
                        </Text>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {channel.status === 'Active' && (
                          <button
                            onClick={() => markAsPosted(channel.id)}
                            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-2 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg"
                            title="Mark as Posted"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => openEditModal(channel)}
                          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 rounded-xl transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Info size={32} className="text-zinc-300" />
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">No channels found. Add your first platform!</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card View (Mobile) */}
      <div className="lg:hidden space-y-4">
        {sortedChannels.length > 0 ? sortedChannels.map(channel => {
          const indicator = getStatusIndicator(channel);
          const lastPosted = new Date(channel.lastPostedDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const daysSince = Math.floor((today.getTime() - lastPosted.getTime()) / (1000 * 60 * 60 * 24));

          return (
            <div key={channel.id} className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                  <Text variant="title" as="span" className="text-lg">
                    {channel.name}
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    <Text variant="label" as="span" className="border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${getDotColor(channel.rowColor)}`} />
                      {channel.platform}
                    </Text>
                    <Text variant="label" as="span" className="border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-full">
                      {channel.contentType || 'Mixed'}
                    </Text>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Text variant="label" as="span" className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold border ${ channel.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : channel.status === 'Paused' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700' }`}>
                    {channel.status}
                  </Text>
                  {channel.status === 'Active' && (
                    <Text variant="label" as="span" className={`flex items-center gap-1.5 font-semibold ${indicator.color}`}>
                      {indicator.icon} {indicator.label}
                    </Text>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col">
                  <Text variant="label" as="span" className="font-semibold">Freq</Text>
                  <Text variant="body" as="span" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{channel.postingFrequency}d</Text>
                </div>
                <div className="flex flex-col">
                  <Text variant="label" as="span" className="font-black">Last</Text>
                  <Text variant="body" as="span" className={`text-sm font-semibold ${daysSince > channel.postingFrequency ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-300'}`}>{daysSince}d</Text>
                </div>
                <div className="flex flex-col items-end">
                  <Text variant="label" as="span" className="font-semibold">Next Due</Text>
                  <Text variant="body" as="span" className={`text-sm font-semibold ${indicator.label === 'Overdue' ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {channel.nextPostDueDate ? new Date(channel.nextPostDueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                  </Text>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  onClick={() => openEditModal(channel)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-2xl"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                {channel.status === 'Active' && (
                  <button
                    onClick={() => markAsPosted(channel.id)}
                    className="flex-[2] flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl shadow-lg"
                  >
                    <CheckCircle2 size={14} />
                    Mark Posted
                  </button>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="p-12 text-center bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <Info size={32} className="mx-auto text-zinc-300 mb-2" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">No channels found</span>
          </div>
        )}
      </div>

      {/* Modal Integration */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChannel ? 'Edit channel' : 'New channel'}
        onSubmit={handleSubmit}
        submitText={editingChannel ? 'Update Channel' : 'Create Channel'}
        accentColor="purple"
      >
        <DynamicForm
          sections={[
            {
              id: 'channel_basic',
              title: '',
              fields: [
                { name: 'name', label: 'Channel / Business Name', type: 'text', required: true, fullWidth: true, placeholder: 'e.g. Personal Brand, Tech Blog...' },
                {
                  name: 'platform', label: 'Platform / Location', type: 'select' as const,
                  options: DEFAULT_PLATFORMS.map(p => ({ label: p, value: p }))
                },
                ...(formData.platform === 'Other' ? [{ name: 'customPlatform', label: 'Other Platform Name', type: 'text' as const, required: true }] : []),
                {
                  name: 'contentType', label: 'Content / Category', type: 'select' as const,
                  options: CONTENT_TYPES.map(t => ({ label: t, value: t }))
                },
                ...(formData.contentType === 'Other' ? [{ name: 'customContentType', label: 'Other Content Type', type: 'text' as const, required: true }] : []),
                { name: 'postingFrequency', label: 'Posting Frequency (Days)', type: 'number', min: 1, required: true },
                { name: 'lastPostedDate', label: 'Last Posted Date', type: 'date', required: true }
              ]
            }
          ]}
          formData={formData}
          accentColor="purple"
          onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
        />

        <div className="flex flex-col gap-3 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 mt-6">
          <label className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Current Status</label>
          <div className="flex gap-2">
            {['Active', 'Paused', 'Idea'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFormData({...formData, status: status as 'Active' | 'Paused' | 'Idea'})}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${ formData.status === status ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm' : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300' }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 mt-6 mb-6">
          <label className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Indicator Color</label>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-2">
            {LIGHT_COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => setFormData({...formData, rowColor: color.value})}
                className={`w-full aspect-square rounded-full border transition-all flex items-center justify-center ${ color.dot } ${ formData.rowColor === color.value ? 'ring-2 ring-zinc-900 dark:ring-white border-transparent' : 'border-zinc-200 dark:border-zinc-700' }`}
                title={color.name}
              >
                {formData.rowColor === color.value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-900" />
                )}
              </button>
            ))}
          </div>
        </div>

        {editingChannel && (
          <div className="pt-4 mt-2">
            <button 
              type="button" 
              onClick={() => deleteChannel(editingChannel.id)} 
              className="text-sm font-semibold text-rose-500 hover:text-rose-700 transition-colors"
            >
              Delete Channel
            </button>
          </div>
        )}
      </Modal>
      {/* Idea Selection Modal */}
      <Modal
        isOpen={isIdeaModalOpen && !!selectedChannelForPost}
        onClose={() => setIsIdeaModalOpen(false)}
        title="Select idea used"
      >
        <div className="pb-4">
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-6">
            Which idea did you just post?
          </p>
          <div className="space-y-3 max-h-[300px] overflow-y-auto mb-8 pr-2">
            {ideas.filter(i => i.channelId === selectedChannelForPost && i.status === 'Pending').map(idea => (
              <button
                key={idea.id}
                onClick={() => markAsPosted(selectedChannelForPost!, idea.id)}
                className="w-full text-left p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 dark:hover:border-teal-500 transition-all group bg-zinc-50 dark:bg-zinc-800/30 hover:bg-teal-50/50 dark:hover:bg-teal-500/10"
              >
                <span className="text-sm font-semibold text-zinc-900 dark:text-white transition-colors">
                  {idea.title}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => markAsPosted(selectedChannelForPost!, 'none')}
            className="w-full py-4 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all"
          >
            Post without an idea from queue
          </button>
        </div>
      </Modal>
    </section>
  );
}
