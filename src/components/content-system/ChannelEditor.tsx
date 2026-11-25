"use client";

import React, { useState } from 'react';
import { AlertCircle, Calendar, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { DEFAULT_PLATFORMS, POST_TYPES, type BusinessChannel, type ContentTypeSchedule } from '@/types/business';
import { brandName, localDateStr } from '@/lib/content-system';

interface Props {
  isOpen: boolean;
  /** Channel being edited, or null for a new one. */
  channel: BusinessChannel | null;
  /** Prefilled brand when adding a platform to an existing brand. */
  presetBrand?: string;
  brands: string[];
  onClose: () => void;
  onSave: (channel: BusinessChannel) => void;
  onDelete: (id: string) => void;
}

const input = 'w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10';
const label = 'text-[10px] font-bold text-zinc-400 uppercase px-1';

type Status = BusinessChannel['status'];

/** Mount with a fresh `key` each time it opens so the form starts from `channel`. */
export function ChannelEditor({ isOpen, channel, presetBrand, brands, onClose, onSave, onDelete }: Props) {
  const standard = channel ? DEFAULT_PLATFORMS.includes(channel.platform) : true;
  const [brand, setBrand] = useState(channel ? brandName(channel) : presetBrand || '');
  const [name, setName] = useState(channel?.name || '');
  const [platform, setPlatform] = useState(channel ? (standard ? channel.platform : 'Other') : 'Instagram');
  const [customPlatform, setCustomPlatform] = useState(channel && !standard ? channel.platform : '');
  const [about, setAbout] = useState(channel?.about || '');
  const [status, setStatus] = useState<Status>(channel?.status || 'Active');
  const [schedules, setSchedules] = useState<ContentTypeSchedule[]>(channel?.schedules ? [...channel.schedules] : []);
  const [newType, setNewType] = useState('Post');
  const [customType, setCustomType] = useState('');
  const [newFrequency, setNewFrequency] = useState(7);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const addSchedule = () => {
    const type = newType === 'Other' ? customType.trim() : newType;
    if (!type) return;
    const today = localDateStr();
    setSchedules(s => [...s, { id: crypto.randomUUID(), type, frequency: Math.max(1, newFrequency), lastPostedDate: today, nextPostDueDate: today }]);
    setCustomType('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || brand.trim();
    if (!finalName) { setError('Enter a brand or account name'); return; }
    const finalPlatform = platform === 'Other' ? customPlatform.trim() || 'Other' : platform;
    const finalBrand = brand.trim();
    onSave({
      ...(channel || {}),
      id: channel?.id || crypto.randomUUID(),
      name: finalName,
      brand: finalBrand && finalBrand.toLowerCase() !== finalName.toLowerCase() ? finalBrand : undefined,
      platform: finalPlatform,
      status,
      about,
      schedules,
    } as BusinessChannel);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={channel ? 'Edit account' : 'New account'} onSubmit={handleSubmit} submitText="Save" accentColor="zinc">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <span className={label}>Brand</span>
          <input list="cs-brands" value={brand} onChange={e => { setBrand(e.target.value); setError(''); }} placeholder="The Lean System" className={input} />
          <datalist id="cs-brands">{brands.map(b => <option key={b} value={b} />)}</datalist>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={label}>Account name</span>
          <input value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder="@theleansystem" className={input} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={label}>Platform</span>
          <select value={platform} onChange={e => setPlatform(e.target.value)} className={input}>
            {DEFAULT_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {platform === 'Other' && (
          <div className="flex flex-col gap-1.5">
            <span className={label}>Platform name</span>
            <input value={customPlatform} onChange={e => setCustomPlatform(e.target.value)} placeholder="Articulate Community" className={input} />
          </div>
        )}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={label}>Description</span>
          <textarea value={about} onChange={e => setAbout(e.target.value)} rows={2} className={input} />
        </div>
      </div>
      {error && <div className="text-xs font-bold text-rose-500">{error}</div>}
      <p className="text-[11px] text-zinc-400 -mt-4">Accounts with the same brand are grouped into one card.</p>

      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-zinc-400" />
          <span className="text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100">Posting schedule</span>
        </div>
        <div className="space-y-2 mb-4">
          {schedules.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.type} <span className="text-xs text-zinc-400 font-medium">· every {s.frequency} {s.frequency === 1 ? 'day' : 'days'}</span></span>
              <button type="button" onClick={() => setSchedules(list => list.filter(x => x.id !== s.id))} aria-label={`Remove ${s.type} schedule`} className="p-1.5 text-zinc-300 hover:text-rose-500">
                <X size={14} />
              </button>
            </div>
          ))}
          {schedules.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase">
              <AlertCircle size={14} /> No schedule yet
            </div>
          )}
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div className="flex flex-col gap-1.5">
            <span className={label}>Type</span>
            <select value={newType} onChange={e => setNewType(e.target.value)} className={input}>
              {POST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={label}>Every (days)</span>
            <input type="number" min={1} value={newFrequency} onChange={e => setNewFrequency(parseInt(e.target.value) || 1)} className={input} />
          </div>
          <button type="button" onClick={addSchedule} className="h-[42px] px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold">Add</button>
        </div>
        {newType === 'Other' && (
          <input value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Webinar" className={`${input} mt-2`} />
        )}
      </div>

      <div className="flex gap-2">
        {(['Active', 'Paused', 'Idea'] as Status[]).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase border transition-all ${
              status === s ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white' : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 border-zinc-100 dark:border-zinc-800'
            }`}
          >
            {s === 'Idea' ? 'Draft' : s}
          </button>
        ))}
      </div>

      {channel && (
        <div className="flex justify-center">
          {confirmDelete ? (
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-zinc-500">Delete this account? This can&apos;t be undone.</span>
              <button type="button" onClick={() => onDelete(channel.id)} className="px-3 py-1.5 rounded-lg bg-rose-500 text-white">Delete</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">Keep</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="text-[11px] font-bold text-rose-500 uppercase hover:bg-rose-50 dark:hover:bg-rose-500/10 px-4 py-2 rounded-xl">
              Delete account
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
