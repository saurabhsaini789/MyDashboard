"use client";
import React, { useState, useMemo } from 'react';
import { Search, Plus, Phone, Mail, Briefcase, AlertTriangle, Clock } from 'lucide-react';
import type { Contact, ContactCategory, ContactStatus } from '@/types/contacts';
import { CONTACT_CATEGORIES, CONTACT_STATUSES, CATEGORY_LABEL, STATUS_LABEL, isFollowUpDue } from '@/types/contacts';
import { ContactModal } from './ContactModal';
import { setSyncedItem } from '@/lib/storage';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { Text } from '../ui/Text';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

type SortMode = 'name' | 'recent-contact' | 'next-follow-up';

const STATUS_STYLE: Record<ContactStatus, string> = {
 lead: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-100 dark:border-amber-900/40',
 contacted: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-100 dark:border-blue-900/40',
 quoted: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 border-purple-100 dark:border-purple-900/40',
 active: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 border-teal-100 dark:border-teal-900/40',
 paid: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-900/40',
 dormant: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700',
 'n/a': 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 border-zinc-100 dark:border-zinc-800',
};

function formatDate(dateStr?: string) {
 if (!dateStr) return null;
 return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function ContactRow({ contact, onEdit }: { contact: Contact; onEdit: (c: Contact) => void }) {
 const dueNow = isFollowUpDue(contact);

 return (
 <div
 onClick={() => onEdit(contact)}
 className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 sm:p-5 mb-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl transition-all hover:shadow-md cursor-pointer"
 >
 <div className="flex-1 min-w-0 flex flex-col gap-1.5">
 <div className="flex items-center gap-2 flex-wrap">
 <Text variant="body" as="h4" className="text-base font-bold group-hover:text-teal-600 transition-colors">
 {contact.name}
 </Text>
 <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
 {CATEGORY_LABEL[contact.category]}
 </span>
 </div>
 <div className="flex items-center gap-4 flex-wrap text-xs font-medium text-zinc-500 dark:text-zinc-400">
 {contact.phone && <span className="flex items-center gap-1.5"><Phone size={12} className="opacity-60" />{contact.phone}</span>}
 {contact.email && <span className="flex items-center gap-1.5"><Mail size={12} className="opacity-60" />{contact.email}</span>}
 {contact.linkedProject && <span className="flex items-center gap-1.5"><Briefcase size={12} className="opacity-60" />{contact.linkedProject}</span>}
 </div>
 </div>

 <div className="flex items-center gap-3 shrink-0 flex-wrap">
 {contact.nextFollowUpDate && (
 <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${dueNow ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border-rose-100 dark:border-rose-900/40' : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-zinc-100 dark:border-zinc-800'}`}>
 {dueNow ? <AlertTriangle size={11} /> : <Clock size={11} />}
 {formatDate(contact.nextFollowUpDate)}
 </span>
 )}
 <Text
 variant="label"
 as="span"
 className={`px-3 py-1.5 rounded-full font-bold border text-xs shrink-0 ${STATUS_STYLE[contact.status]}`}
 >
 {STATUS_LABEL[contact.status]}
 </Text>
 </div>
 </div>
 );
}

export function ContactsList() {
 const contacts = useStorageSubscription<Contact[]>(SYNC_KEYS.CONTACTS, []);
 const [searchQuery, setSearchQuery] = useState('');
 const [categoryFilter, setCategoryFilter] = useState<ContactCategory | 'all'>('all');
 const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
 const [projectFilter, setProjectFilter] = useState<string>('all');
 const [sortMode, setSortMode] = useState<SortMode>('name');
 const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
 const [isAdding, setIsAdding] = useState(false);

 const saveContacts = (next: Contact[]) => {
 setSyncedItem(SYNC_KEYS.CONTACTS, JSON.stringify(next));
 };

 const handleAddContact = (newContact: Contact) => {
 saveContacts([...contacts, { ...newContact, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
 };

 const handleUpdateContact = (updated: Contact) => {
 saveContacts(contacts.map(c => (c.id === updated.id ? updated : c)));
 };

 const handleDeleteContact = (id: string) => {
 saveContacts(contacts.filter(c => c.id !== id));
 };

 const linkedProjects = useMemo(() => {
 const set = new Set<string>();
 contacts.forEach(c => c.linkedProject && set.add(c.linkedProject));
 return Array.from(set).sort();
 }, [contacts]);

 const followUpsDue = useMemo(() => {
 return contacts
 .filter(isFollowUpDue)
 .sort((a, b) => (a.nextFollowUpDate || '').localeCompare(b.nextFollowUpDate || ''));
 }, [contacts]);

 const filteredContacts = useMemo(() => {
 const q = searchQuery.trim().toLowerCase();
 let list = contacts.filter(c => {
 if (q && !c.name.toLowerCase().includes(q)) return false;
 if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
 if (statusFilter !== 'all' && c.status !== statusFilter) return false;
 if (projectFilter !== 'all' && c.linkedProject !== projectFilter) return false;
 return true;
 });

 list = [...list].sort((a, b) => {
 if (sortMode === 'name') return a.name.localeCompare(b.name);
 if (sortMode === 'recent-contact') return (b.lastContactDate || '').localeCompare(a.lastContactDate || '');
 // next-follow-up: contacts with a date first (soonest first), undated last
 if (a.nextFollowUpDate && b.nextFollowUpDate) return a.nextFollowUpDate.localeCompare(b.nextFollowUpDate);
 if (a.nextFollowUpDate) return -1;
 if (b.nextFollowUpDate) return 1;
 return a.name.localeCompare(b.name);
 });

 return list;
 }, [contacts, searchQuery, categoryFilter, statusFilter, projectFilter, sortMode]);

 return (
 <div className="w-full">
 {/* ── Follow-ups Due ────────────────────────────── */}
 {followUpsDue.length > 0 && (
 <div className="mb-8 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-500/5">
 <div className="flex items-center gap-2 mb-4">
 <AlertTriangle size={18} className="text-rose-500" />
 <Text variant="title" as="h3" className="text-base text-rose-600 dark:text-rose-400">
 Follow-ups Due ({followUpsDue.length})
 </Text>
 </div>
 <div>
 {followUpsDue.map(c => (
 <ContactRow key={c.id} contact={c} onEdit={setSelectedContact} />
 ))}
 </div>
 </div>
 )}

 {/* ── Filters ────────────────────────────── */}
 <div className="flex flex-col gap-3 mb-6">
 <div className="flex flex-col sm:flex-row items-center gap-3">
 <div className="relative w-full sm:max-w-md">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
 <input
 type="text"
 placeholder="Search by name..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-sm transition-all"
 />
 </div>
 <button
 onClick={() => setIsAdding(true)}
 className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 dark:bg-teal-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold hover:scale-[1.02] transition-all shadow-sm shrink-0"
 >
 <Plus size={18} />
 Add Contact
 </button>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <select
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value as ContactCategory | 'all')}
 className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50"
 >
 <option value="all">All Categories</option>
 {CONTACT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
 </select>

 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value as ContactStatus | 'all')}
 className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50"
 >
 <option value="all">All Statuses</option>
 {CONTACT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
 </select>

 {linkedProjects.length > 0 && (
 <select
 value={projectFilter}
 onChange={(e) => setProjectFilter(e.target.value)}
 className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50"
 >
 <option value="all">All Projects</option>
 {linkedProjects.map(p => <option key={p} value={p}>{p}</option>)}
 </select>
 )}

 <select
 value={sortMode}
 onChange={(e) => setSortMode(e.target.value as SortMode)}
 className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50 ml-auto"
 >
 <option value="name">Sort: Name (A-Z)</option>
 <option value="recent-contact">Sort: Most Recently Contacted</option>
 <option value="next-follow-up">Sort: Next Follow-up Date</option>
 </select>
 </div>
 </div>

 {/* ── List ────────────────────────────── */}
 {contacts.length === 0 ? (
 <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center gap-4">
 <Text variant="title" as="h3" className="text-xl">No contacts yet</Text>
 <button onClick={() => setIsAdding(true)} className="text-sm font-bold text-teal-600 uppercase">Add your first contact</button>
 </div>
 ) : filteredContacts.length === 0 ? (
 <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
 <Text variant="body" muted>No contacts match your filters.</Text>
 </div>
 ) : (
 <div>
 {filteredContacts.map(c => (
 <ContactRow key={c.id} contact={c} onEdit={setSelectedContact} />
 ))}
 </div>
 )}

 {(selectedContact || isAdding) && (
 <ContactModal
 mode={isAdding ? 'create' : 'edit'}
 contact={selectedContact || {
 id: '',
 name: '',
 category: 'other',
 status: 'lead',
 createdAt: new Date().toISOString(),
 }}
 onClose={() => {
 setSelectedContact(null);
 setIsAdding(false);
 }}
 onUpdateContact={isAdding ? handleAddContact : handleUpdateContact}
 onDeleteContact={handleDeleteContact}
 />
 )}
 </div>
 );
}
