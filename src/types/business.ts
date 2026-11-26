export interface ContentTypeSchedule {
 id: string;
 type: string; // 'Post', 'Reel', 'Video', 'Networking', or custom
 frequency: number; // in days
 lastPostedDate: string; // ISO date
 nextPostDueDate: string; // ISO date
}

export interface BusinessChannel {
 id: string;
 name: string;
 platform: string;
 status: 'Active' | 'Paused' | 'Idea';
 schedules: ContentTypeSchedule[];
 rowColor?: string;
 about?: string;
 /** Groups accounts across platforms. Falls back to `name` when empty. */
 brand?: string;
 /** Brand logo as a small data URL (128px square), shared by every account in the brand. */
 logo?: string;
 /** Who handles the brand, e.g. "Saurabh" or "Neha". Shared by every account in the brand. Defaults to Saurabh. */
 owner?: string;
 /** Stats-only account: no posting schedule, only followers/views are tracked. */
 trackOnly?: boolean;
 /** Profile link, opened from the account row. */
 url?: string;
 /** Growth goal for one metric, e.g. 20,000 followers by 2027-03-31. */
 target?: ChannelTarget;
 /** YYYY-MM-DD the status last changed: how long a draft or paused account has been sitting. */
 statusSince?: string;
 /** Dates (YYYY-MM-DD) the account was marked as posted, oldest first. Feeds the posting streak. */
 postLog?: string[];
}

export interface ChannelTarget {
 metric: string;
 value: number;
 /** Optional deadline (YYYY-MM-DD); without it there is no on-pace check. */
 by?: string;
 /** Day the target was set (YYYY-MM-DD); the pace is measured from the stat logged closest to it. */
 setOn: string;
}

export interface ContentIdea {
 id: string;
 channelId: string;
 title: string;
 notes?: string;
 status: 'Pending' | 'Completed';
 createdAt: string;
 /** Position in its brand's queue (lower first). Missing = after ordered ideas, oldest first. */
 order?: number;
}

/** Ideas with this channelId sit in the inbox until assigned to a brand. */
export const INBOX_CHANNEL = '';

/** One dated measurement for an account, e.g. 12,400 followers on 2026-11-25. */
export interface ChannelStat {
 id: string;
 channelId: string;
 metric: string;
 value: number;
 date: string; // YYYY-MM-DD
 createdAt: string;
}

export const STAT_METRICS = [
 'Followers',
 'Subscribers',
 'Views',
 'Likes',
 'Watch hours',
 'Other'
];

export const DEFAULT_PLATFORMS = [
 'Instagram',
 'YouTube',
 'LinkedIn',
 'X (Twitter)',
 'Facebook',
 'TikTok',
 'Pinterest',
 'Other'
];

export const POST_TYPES = [
 'Post',
 'Reel',
 'Video',
 'Shorts',
 'Networking',
 'Story',
 'Carousel',
 'Other'
];

export const CONTENT_TYPES = POST_TYPES; // Maintain compatibility if needed elsewhere

