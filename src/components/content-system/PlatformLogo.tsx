import React from 'react';

function text(t: string, size = 0.55): React.ReactNode {
  return (
    <text x="12" y="12" dy="0.35em" textAnchor="middle" fontSize={24 * size} fontWeight={800} fontFamily="Arial, Helvetica, sans-serif" fill="#fff">{t}</text>
  );
}

const PLATFORMS: Record<string, { bg: string; glyph: React.ReactNode }> = {
  instagram: {
    bg: 'linear-gradient(45deg,#F58529 0%,#DD2A7B 50%,#8134AF 100%)',
    glyph: (
      <g fill="none" stroke="#fff" strokeWidth={2}>
        <rect x="5" y="5" width="14" height="14" rx="4" />
        <circle cx="12" cy="12" r="3.3" />
        <circle cx="16.4" cy="7.6" r="0.6" fill="#fff" stroke="none" />
      </g>
    ),
  },
  youtube: { bg: '#FF0000', glyph: <path d="M10 8.2v7.6l6-3.8z" fill="#fff" /> },
  linkedin: { bg: '#0A66C2', glyph: text('in', 0.5) },
  pinterest: { bg: '#E60023', glyph: text('P', 0.6) },
  facebook: { bg: '#1877F2', glyph: text('f', 0.62) },
  'x (twitter)': { bg: '#111111', glyph: text('X', 0.5) },
  x: { bg: '#111111', glyph: text('X', 0.5) },
  tiktok: { bg: '#111111', glyph: text('♪', 0.6) },
};

export function platformColor(platform: string): string {
  const p = PLATFORMS[platform.toLowerCase()];
  if (!p) return '#71717a';
  return p.bg.startsWith('linear') ? '#DD2A7B' : p.bg === '#111111' ? '#52525b' : p.bg;
}

export function PlatformLogo({ platform, size = 24, className = '' }: { platform: string; size?: number; className?: string }) {
  const p = PLATFORMS[platform.toLowerCase()];
  const fallback = text((platform.trim()[0] || '?').toUpperCase(), 0.5);
  return (
    <span
      role="img"
      aria-label={platform}
      title={platform}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size, borderRadius: size * 0.28, background: p ? p.bg : '#71717a' }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        {p ? p.glyph : fallback}
      </svg>
    </span>
  );
}
