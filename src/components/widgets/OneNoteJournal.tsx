'use client';

import React, { useState, useMemo } from 'react';
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from '@/lib/msalConfig';
import { onenoteService } from '@/lib/onenote';
import { SectionTitle, Description } from '@/components/ui/Text';
import {
  BookOpen, CloudUpload, CheckCircle2, AlertCircle, Loader2, LogOut,
  ChevronRight, Sun, Zap, Moon,
} from 'lucide-react';
import { Editor } from './Editor';

// ─── Types ───────────────────────────────────────────────────────────────────
type Phase = 'morning' | 'day' | 'evening';

// ─── Phase Templates ─────────────────────────────────────────────────────────
const PHASE_TEMPLATES: Record<Phase, string> = {
  morning: `<h2><strong>🌅 Morning Journal</strong></h2>
<p><strong>How do I want today to feel?</strong></p>
<p></p>
<p><strong>Top 1–3 priorities:</strong></p>
<ul data-type="taskList">
  <li data-checked="false"></li>
  <li data-checked="false"></li>
  <li data-checked="false"></li>
</ul>
<p></p>
<p><strong>What could derail me today?</strong></p>
<p></p>
<p><strong>How will I respond instead?</strong></p>
<p></p>
<p><strong>One personal intention for today:</strong></p>`,

  day: `<h2><strong>⚡ Daytime Log</strong></h2>
<p>Capture reality, patterns, emotions, and ideas as they happen.</p>
<p></p>
<p><strong>[idea]</strong> </p>
<p></p>
<p><strong>[stress]</strong> </p>
<p></p>
<p><strong>[energy]</strong> </p>
<p></p>
<p><strong>[win]</strong> </p>
<p></p>
<p><strong>[lesson]</strong> </p>
<p></p>
<p><strong>[decision]</strong> </p>`,

  evening: `<h2><strong>🌙 Evening Reflection</strong></h2>
<p></p>
<p><strong>Wins today (even small ones):</strong></p>
<p></p>
<p><strong>What drained me?</strong></p>
<p></p>
<p><strong>What worked well today?</strong></p>
<p></p>
<p><strong>One lesson or realization:</strong></p>
<p></p>
<p><strong>What needs carrying into tomorrow?</strong></p>
<p></p>
<p><strong>Gratitude or appreciation:</strong></p>`,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getCurrentPhase(): Phase {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'day';
  return 'evening';
}

function buildHtml(phase: Phase, text: string): string {
  const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const phaseLabel: Record<Phase, string> = {
    morning: `🌅 Morning Journal — ${ts}`,
    day: `⚡ Daytime Log — ${ts}`,
    evening: `🌙 Evening Reflection — ${ts}`,
  };

  return `<h2>${phaseLabel[phase]}</h2>${text}`;
}

// ─── Phase Config ─────────────────────────────────────────────────────────────
const PHASE_CONFIG = {
  morning: { label: 'Morning', icon: Sun, time: 'Before noon' },
  day:     { label: 'Daytime', icon: Zap,  time: 'Noon – 6pm' },
  evening: { label: 'Evening', icon: Moon, time: 'After 6pm'  },
};

// ─── Main Component ────────────────────────────────────────────────────────────
export function OneNoteJournal() {
  const { instance, accounts, inProgress } = useMsal();
  const autoPhase = useMemo(() => getCurrentPhase(), []);
  const [phase, setPhase] = useState<Phase>(autoPhase);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastPageUrl, setLastPageUrl] = useState('');

  // One text entry per phase; track which phases have been visited so we
  // only inject the template the first time the user switches to that phase.
  const [texts, setTexts] = useState<Record<Phase, string>>({
    morning: '',
    day: '',
    evening: '',
  });
  const [visited, setVisited] = useState<Record<Phase, boolean>>({
    morning: false,
    day: false,
    evening: false,
  });

  const isInteractionInProgress = inProgress !== InteractionStatus.None;

  const handlePhaseSwitch = (p: Phase) => {
    setPhase(p);
    // Only inject the template if this phase hasn't been visited yet AND the textarea is empty
    if (!visited[p] && !texts[p].trim()) {
      setTexts(prev => ({ ...prev, [p]: PHASE_TEMPLATES[p] }));
    }
    setVisited(prev => ({ ...prev, [p]: true }));
  };

  const handleTextChange = (value: string) => {
    setTexts(prev => ({ ...prev, [phase]: value }));
  };

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
    const text = texts[phase];
    if (!text.trim()) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const title = `Journal - ${date}`;
      const html = buildHtml(phase, text);
      const response = await onenoteService.createOrUpdatePage(title, html);
      const pageUrl = response?.links?.oneNoteWebUrl?.href;
      setSaveStatus('success');
      setLastPageUrl(pageUrl);

      // Track locally for Growth/Pulse metrics
      try {
        const key = 'os_journal_logs';
        const raw = localStorage.getItem(key);
        const logs: string[] = raw ? JSON.parse(raw) : [];
        const todayStr = new Date().toISOString().split('T')[0];
        if (!logs.includes(todayStr)) {
          logs.push(todayStr);
          localStorage.setItem(key, JSON.stringify(logs));
          window.dispatchEvent(new Event('local-storage'));
        }
      } catch (err) {
        console.error('Failed to update local journal log', err);
      }

      setTimeout(() => { setSaveStatus('idle'); setLastPageUrl(''); }, 10000);
    } catch (error: any) {
      console.error('Failed to save journal', error);
      setSaveStatus('error');
      setErrorMessage(error.message || 'Failed to sync with OneNote');
    } finally {
      setIsSaving(false);
    }
  };

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
              <Description>Daily entries · synced to OneNote</Description>
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
              <button key={p} onClick={() => handlePhaseSwitch(p)}
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

            {/* Textarea */}
            <div className="animate-in fade-in duration-300">
              <Editor
                content={texts[phase]}
                onChange={handleTextChange}
                placeholder={`Start writing your ${PHASE_CONFIG[phase].label.toLowerCase()} entry...`}
              />
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

              <button onClick={handleSave} disabled={isSaving || !texts[phase].trim()}
                className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-semibold transition-all duration-300 ${isSaving || !texts[phase].trim() ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105 active:scale-95 shadow-lg shadow-zinc-400/20 dark:shadow-none'}`}>
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
                Sign in with your Microsoft account to securely sync your journal entries.
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
