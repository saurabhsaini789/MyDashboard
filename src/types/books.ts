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
