'use client';

import React, { useState, useMemo } from 'react';
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from '@/lib/msalConfig';
import { onenoteService } from '@/lib/onenote';
import { SectionTitle, Description } from '@/components/ui/Text';
import {
  BookOpen, CloudUpload, CheckCircle2, AlertCircle, Loader2, LogOut,
  ChevronRight, Sun, Zap, Moon, Tag, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Phase = 'morning' | 'day' | 'evening';

interface MorningData {
  feel: string;
  priorities: string[];
  derail: string[];
  response: string;
  intention: string;
}

interface DayEntry {
  tag: string;
  text: string;
}

interface EveningData {
  wins: string;
  drained: string[];
  worked: string;
  lesson: string;
  carry: string;
  gratitude: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getCurrentPhase(): Phase {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'day';
  return 'evening';
}

function buildHtml(phase: Phase, morning: MorningData, day: DayEntry[], evening: EveningData): string {
  const lines: string[] = [];
  const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (phase === 'morning') {
    lines.push(`<h2>🌅 Morning Journal — ${ts}</h2>`);
    if (morning.feel) lines.push(`<p><strong>How I want today to feel:</strong> ${morning.feel}</p>`);
    const p = morning.priorities.filter(Boolean);
    if (p.length) lines.push(`<p><strong>Top Priorities:</strong></p><ul>${p.map(x => `<li>${x}</li>`).join('')}</ul>`);
    const d = morning.derail.filter(Boolean);
    if (d.length) lines.push(`<p><strong>What could derail me:</strong> ${d.join(', ')}</p>`);
    if (morning.response) lines.push(`<p><strong>My response plan:</strong> ${morning.response}</p>`);
    if (morning.intention) lines.push(`<p><strong>Personal intention:</strong> ${morning.intention}</p>`);
  } else if (phase === 'day') {
    lines.push(`<h2>⚡ Daytime Log — ${ts}</h2>`);
    day.filter(e => e.text).forEach(e => {
      lines.push(`<p><strong>[${e.tag}]</strong> ${e.text}</p>`);
    });
  } else {
    lines.push(`<h2>🌙 Evening Reflection — ${ts}</h2>`);
    if (evening.wins) lines.push(`<p><strong>Wins today:</strong> ${evening.wins}</p>`);
    const dr = evening.drained.filter(Boolean);
    if (dr.length) lines.push(`<p><strong>What drained me:</strong> ${dr.join(', ')}</p>`);
    if (evening.worked) lines.push(`<p><strong>What worked well:</strong> ${evening.worked}</p>`);
    if (evening.lesson) lines.push(`<p><strong>One lesson:</strong> ${evening.lesson}</p>`);
    if (evening.carry) lines.push(`<p><strong>Carry into tomorrow:</strong> ${evening.carry}</p>`);
    if (evening.gratitude) lines.push(`<p><strong>Gratitude:</strong> ${evening.gratitude}</p>`);
  }

  return lines.join('\n');
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
      </button>
      {open && <div className="p-4 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

function ChipSelect({ options, selected, onToggle, color = 'teal' }: {
  options: string[]; selected: string[]; onToggle: (v: string) => void; color?: string;
}) {
  const active = `bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 border-${color}-300 dark:border-${color}-700`;
  const inactive = 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} onClick={() => onToggle(o)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${selected.includes(o) ? active : inactive}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none transition-all"
    />
  );
}

// ─── Morning Phase ─────────────────────────────────────────────────────────────
const FEEL_OPTIONS = ['calm', 'focused', 'energetic', 'disciplined', 'creative'];
const DERAIL_OPTIONS = ['distraction', 'overthinking', 'procrastination', 'meetings', 'low energy'];
const INTENTION_OPTIONS = ['patience', 'confidence', 'listening', 'consistency', 'presence'];

function MorningPhase({ data, onChange }: { data: MorningData; onChange: (d: MorningData) => void }) {
  const set = (k: keyof MorningData, v: any) => onChange({ ...data, [k]: v });
  const toggleArr = (k: 'derail', v: string) => {
    const arr = data[k];
    set(k, arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };

  return (
    <div className="flex flex-col gap-3">
      <Accordion title="🌤 How do I want today to feel?" defaultOpen>
        <ChipSelect options={FEEL_OPTIONS} selected={data.feel ? [data.feel] : []} onToggle={v => set('feel', data.feel === v ? '' : v)} />
        <Textarea value={data.feel && !FEEL_OPTIONS.includes(data.feel) ? data.feel : ''} onChange={v => set('feel', v)} placeholder="Or write your own..." rows={1} />
      </Accordion>

      <Accordion title="🎯 Top 1–3 priorities" defaultOpen>
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold shrink-0">{i + 1}</span>
            <input
              type="text"
              value={data.priorities[i] || ''}
              onChange={e => {
                const p = [...data.priorities];
                p[i] = e.target.value;
                set('priorities', p);
              }}
              placeholder={`Priority ${i + 1}${i === 0 ? ' (most important)' : ''}`}
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all"
            />
          </div>
        ))}
      </Accordion>

      <Accordion title="⚠️ What could derail me?">
        <ChipSelect options={DERAIL_OPTIONS} selected={data.derail} onToggle={v => toggleArr('derail', v)} color="amber" />
      </Accordion>

      <Accordion title="💬 How will I respond instead?">
        <Textarea value={data.response} onChange={v => set('response', v)} placeholder={`"If distracted → 10 min focus sprint"\n"If anxious → simplify next step"`} rows={3} />
      </Accordion>

      <Accordion title="✨ One personal intention">
        <ChipSelect options={INTENTION_OPTIONS} selected={data.intention ? [data.intention] : []} onToggle={v => set('intention', data.intention === v ? '' : v)} />
        <Textarea value={data.intention && !INTENTION_OPTIONS.includes(data.intention) ? data.intention : ''} onChange={v => set('intention', v)} placeholder="Or write your own..." rows={1} />
      </Accordion>
    </div>
  );
}

// ─── Day Phase ─────────────────────────────────────────────────────────────────
const DAY_TAGS = ['idea', 'stress', 'energy', 'win', 'lesson', 'decision'];

function DayPhase({ entries, onChange }: { entries: DayEntry[]; onChange: (e: DayEntry[]) => void }) {
  const [tag, setTag] = useState('idea');
  const [text, setText] = useState('');

  const add = () => {
    if (!text.trim()) return;
    onChange([...entries, { tag, text: text.trim() }]);
    setText('');
  };

  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Capture reality, patterns, emotions, ideas as they happen.</p>

      {/* Tag selector */}
      <div className="flex flex-wrap gap-2">
        {DAY_TAGS.map(t => (
          <button key={t} onClick={() => setTag(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${tag === t ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'}`}>
            [{t}]
          </button>
        ))}
      </div>

      {/* Entry input */}
      <div className="flex gap-2">
        <Textarea value={text} onChange={setText} placeholder={`Log something tagged [${tag}]...`} rows={2} />
        <button onClick={add}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-all shrink-0 self-end">
          Add
        </button>
      </div>

      {/* Existing entries */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-2">
          {entries.map((e, i) => (
            <div key={i} className="flex items-start gap-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg group">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5 shrink-0">[{e.tag}]</span>
              <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">{e.text}</span>
              <button onClick={() => remove(i)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 text-xs transition-all">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Evening Phase ─────────────────────────────────────────────────────────────
const DRAINED_OPTIONS = ['people', 'habits', 'environment', 'decisions', 'screen time', 'no breaks'];
const WORKED_OPTIONS = ['routines', 'focus blocks', 'mindset', 'conversations', 'exercise', 'planning'];

function EveningPhase({ data, onChange }: { data: EveningData; onChange: (d: EveningData) => void }) {
  const set = (k: keyof EveningData, v: any) => onChange({ ...data, [k]: v });
  const toggleArr = (k: 'drained', v: string) => {
    const arr = data[k];
    set(k, arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };

  return (
    <div className="flex flex-col gap-3">
      <Accordion title="🏆 Wins today" defaultOpen>
        <Textarea value={data.wins} onChange={v => set('wins', v)} placeholder="Even small wins count — they train your brain to notice progress..." rows={3} />
      </Accordion>

      <Accordion title="🔋 What drained me?">
        <ChipSelect options={DRAINED_OPTIONS} selected={data.drained} onToggle={v => toggleArr('drained', v)} color="red" />
      </Accordion>

      <Accordion title="✅ What worked well today?">
        <ChipSelect options={WORKED_OPTIONS} selected={[]} onToggle={() => {}} color="teal" />
        <Textarea value={data.worked} onChange={v => set('worked', v)} placeholder="Routines, focus blocks, mindset shifts..." rows={2} />
      </Accordion>

      <Accordion title="💡 One lesson or realization">
        <Textarea value={data.lesson} onChange={v => set('lesson', v)} placeholder="Keep it simple — one clear insight..." rows={2} />
      </Accordion>

      <Accordion title="📌 What needs carrying into tomorrow?">
        <Textarea value={data.carry} onChange={v => set('carry', v)} placeholder="Unfinished task, concern, reminder..." rows={2} />
      </Accordion>

      <Accordion title="🙏 Gratitude or appreciation (optional)">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Only if it feels genuine — don't force it.</p>
        <Textarea value={data.gratitude} onChange={v => set('gratitude', v)} placeholder="Anything you appreciated today..." rows={2} />
      </Accordion>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const PHASE_CONFIG = {
  morning: { label: 'Morning', icon: Sun, color: 'amber', emoji: '🌅', time: 'Before noon' },
  day: { label: 'Daytime', icon: Zap, color: 'teal', emoji: '⚡', time: 'Noon – 6pm' },
  evening: { label: 'Evening', icon: Moon, color: 'indigo', emoji: '🌙', time: 'After 6pm' },
};

export function OneNoteJournal() {
  const { instance, accounts, inProgress } = useMsal();
  const autoPhase = useMemo(() => getCurrentPhase(), []);
  const [phase, setPhase] = useState<Phase>(autoPhase);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastPageUrl, setLastPageUrl] = useState('');

  // Phase data
  const [morning, setMorning] = useState<MorningData>({ feel: '', priorities: ['', '', ''], derail: [], response: '', intention: '' });
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [evening, setEvening] = useState<EveningData>({ wins: '', drained: [], worked: '', lesson: '', carry: '', gratitude: '' });

  const isInteractionInProgress = inProgress !== InteractionStatus.None;

  const handleLogin = () => {
    if (inProgress === InteractionStatus.None) {
      instance.loginRedirect(loginRequest).catch(e => console.error('Login redirect failed:', e));
    }
  };

  const handleLogout = () => {
    if (inProgress === InteractionStatus.None) {
      instance.logoutRedirect().catch(e => console.error('Logout redirect failed:', e));
    }
  };

  const handleSave = async () => {
    const html = buildHtml(phase, morning, dayEntries, evening);
    if (!html.trim()) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const title = `Journal - ${date}`;
      const response = await onenoteService.createOrUpdatePage(title, html);
      const pageUrl = response?.links?.oneNoteWebUrl?.href;
      setSaveStatus('success');
      setLastPageUrl(pageUrl);
      setTimeout(() => { setSaveStatus('idle'); setLastPageUrl(''); }, 10000);
    } catch (error: any) {
      console.error('Failed to save journal', error);
      setSaveStatus('error');
      setErrorMessage(error.message || 'Failed to sync with OneNote');
    } finally {
      setIsSaving(false);
    }
  };

  const PhaseIcon = PHASE_CONFIG[phase].icon;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300">
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-500/10 rounded-2xl">
              <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <SectionTitle>Journal</SectionTitle>
              <Description>Structured entries · synced to OneNote</Description>
            </div>
          </div>
          <AuthenticatedTemplate>
            <button onClick={handleLogout} disabled={isInteractionInProgress}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors disabled:opacity-50" title="Logout from OneNote">
              <LogOut className="w-5 h-5" />
            </button>
          </AuthenticatedTemplate>
        </div>

        {/* Phase Tabs */}
        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
          {(Object.keys(PHASE_CONFIG) as Phase[]).map(p => {
            const cfg = PHASE_CONFIG[p];
            const Icon = cfg.icon;
            const isActive = phase === p;
            const isAuto = p === autoPhase;
            return (
              <button key={p} onClick={() => setPhase(p)}
                className={`flex-1 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${isActive ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                {isAuto && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-500" title="Current phase" />
                )}
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-500' : ''}`} />
                <span>{cfg.label}</span>
                <span className={`text-[10px] ${isActive ? 'text-zinc-400' : 'text-zinc-400 dark:text-zinc-600'}`}>{cfg.time}</span>
              </button>
            );
          })}
        </div>

        {/* Authenticated Content */}
        <AuthenticatedTemplate>
          <div className="flex flex-col gap-5">

            {/* Connected badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 w-fit">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {instance.getActiveAccount()?.name || accounts[0]?.name || 'User'}
              </span>
            </div>

            {/* Phase Content */}
            <div className="animate-in fade-in duration-300">
              {phase === 'morning' && <MorningPhase data={morning} onChange={setMorning} />}
              {phase === 'day' && <DayPhase entries={dayEntries} onChange={setDayEntries} />}
              {phase === 'evening' && <EveningPhase data={evening} onChange={setEvening} />}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                {saveStatus === 'success' && (
                  <div className="flex flex-col gap-1 items-start animate-in fade-in slide-in-from-left-2">
                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Synced to OneNote!</span>
                    </div>
                    {lastPageUrl && (
                      <a href={lastPageUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-teal-500 hover:text-teal-600 underline ml-7">View in OneNote →</a>
                    )}
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-left-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{errorMessage}</span>
                  </div>
                )}
              </div>

              <button onClick={handleSave} disabled={isSaving}
                className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-semibold transition-all duration-300 ${isSaving ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105 active:scale-95 shadow-lg shadow-zinc-400/20 dark:shadow-none'}`}>
                {isSaving ? (<><Loader2 className="w-5 h-5 animate-spin" />Syncing...</>) : (<><CloudUpload className="w-5 h-5" />Sync to OneNote</>)}
              </button>
            </div>
          </div>
        </AuthenticatedTemplate>

        {/* Unauthenticated */}
        <UnauthenticatedTemplate>
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl gap-6">
            <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center mb-2">
              <BookOpen className="w-10 h-10 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Connect Your OneNote</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Sign in with your Microsoft account to securely sync your structured journal entries.
              </p>
            </div>
            <button onClick={handleLogin} disabled={isInteractionInProgress}
              className="flex items-center gap-3 px-8 py-4 bg-[#05a6f0] hover:bg-[#0078d4] text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:grayscale">
              {isInteractionInProgress ? (<><Loader2 className="w-5 h-5 animate-spin" />Connecting...</>) : (<>Sign in with Microsoft<ChevronRight className="w-5 h-5" /></>)}
            </button>
          </div>
        </UnauthenticatedTemplate>

      </div>
    </div>
  );
}
