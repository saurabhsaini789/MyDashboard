export type ContactCategory =
 | 'family'
 | 'freelance-lead'
 | 'freelance-client'
 | 'bookshop-contact'
 | 'saini-creations-client'
 | 'village'
 | 'vendor'
 | 'friend'
 | 'other';

export type ContactStatus =
 | 'lead'
 | 'contacted'
 | 'quoted'
 | 'active'
 | 'paid'
 | 'dormant'
 | 'n/a';

export interface Contact {
 id: string;
 name: string;
 category: ContactCategory;
 phone?: string;
 email?: string;
 linkedProject?: string;
 status: ContactStatus;
 lastContactDate?: string; // YYYY-MM-DD
 nextFollowUpDate?: string; // YYYY-MM-DD
 notes?: string;
 createdAt: string; // ISO date string
}

export const CONTACT_CATEGORIES: { value: ContactCategory; label: string }[] = [
 { value: 'family', label: 'Family' },
 { value: 'freelance-lead', label: 'Freelance Lead' },
 { value: 'freelance-client', label: 'Freelance Client' },
 { value: 'bookshop-contact', label: 'Bookshop Contact' },
 { value: 'saini-creations-client', label: 'Saini Creations Client' },
 { value: 'village', label: 'Village' },
 { value: 'vendor', label: 'Vendor' },
 { value: 'friend', label: 'Friend' },
 { value: 'other', label: 'Other' },
];

export const CONTACT_STATUSES: { value: ContactStatus; label: string }[] = [
 { value: 'lead', label: 'Lead' },
 { value: 'contacted', label: 'Contacted' },
 { value: 'quoted', label: 'Quoted' },
 { value: 'active', label: 'Active' },
 { value: 'paid', label: 'Paid' },
 { value: 'dormant', label: 'Dormant' },
 { value: 'n/a', label: 'N/A' },
];

export const CATEGORY_LABEL: Record<ContactCategory, string> =
 Object.fromEntries(CONTACT_CATEGORIES.map(c => [c.value, c.label])) as Record<ContactCategory, string>;

export const STATUS_LABEL: Record<ContactStatus, string> =
 Object.fromEntries(CONTACT_STATUSES.map(s => [s.value, s.label])) as Record<ContactStatus, string>;

/** Today's date, normalized to midnight, for follow-up due comparisons. */
export const getToday = (): Date => {
 const d = new Date();
 d.setHours(0, 0, 0, 0);
 return d;
};

/** A contact is due for follow-up if nextFollowUpDate is today or in the past. */
export const isFollowUpDue = (contact: Contact): boolean => {
 if (!contact.nextFollowUpDate) return false;
 const due = new Date(contact.nextFollowUpDate + 'T00:00:00');
 return due <= getToday();
};
