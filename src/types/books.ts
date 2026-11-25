export interface Book {
 id: string;
 order: number;
 name: string;
 author: string;
 language: 'English' | 'Hindi' | 'Urdu' | 'Punjabi' | 'Sanskrit' | 'Other';
 category: string;
 status: 'Planned' | 'Reading' | 'Completed';
 createdAt: string;
}

export const BOOK_CATEGORIES = [
 'Fiction',
 'Science',
 'Psychology',
 'Education',
 'Politics',
 'Literature',
 'Self-help',
 'Technical',
 'Finance',
 'Health',
 'Biography',
 'History',
 'Philosophy',
 'Spirituality',
 'Other'
];

export interface LogBookEntry {
 id: string;
 title: string;
 author: string;
 category?: string;
 status: 'Completed' | 'Reading' | 'Planned' | 'None';
 originalQueueId?: string;
}

export interface MonthlyEntry {
 englishBooks: LogBookEntry[];
 hindiBooks: LogBookEntry[];
}

export type YearlyLogData = Record<string, MonthlyEntry>; // Month name is key

export type MultiYearLogData = Record<number, YearlyLogData>; // Year is key

export interface CompletedBook {
 id: string;
 name: string;
 author: string;
 language: 'English' | 'Hindi' | 'Urdu' | 'Punjabi' | 'Sanskrit' | 'Other';
 category: string;
 completionDate: string; // YYYY-MM-DD
 rating: number; // 1-5
 notes: string;
 wouldRecommend: boolean;
 createdAt: string;
}

export type BookSource = 'queue' | 'log';

/**
 * One record per book. Reading status and owning a physical copy are independent:
 * a finished book may not be owned (read digitally), an owned book may be unread.
 */
export interface LibraryBook {
 id: string;
 title: string;
 author: string;
 /** Shown on covers only, for Hindi books. */
 titleHi?: string;
 authorHi?: string;
 language: 'English' | 'Hindi';
 category?: string;
 status: 'want' | 'reading' | 'done';
 owned: boolean;
 /** Reading order among 'want' books (lower first). */
 order?: number;
 startedOn?: string; // YYYY-MM-DD
 finishedOn?: string; // YYYY-MM-DD
 rating?: number; // 0-5
 notes?: string;
 createdAt: string;
}
