import { Noto_Serif_Devanagari } from 'next/font/google';

/** Devanagari face for Hindi titles printed on covers. */
export const devanagari = Noto_Serif_Devanagari({ subsets: ['devanagari'], weight: ['500', '800'], display: 'swap' });

export { displayNumerals as display } from '@/components/content-system/fonts';
