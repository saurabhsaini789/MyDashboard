/**
 * Trigger haptic feedback on supported devices (iOS/Android PWA).
 * Silently no-ops in desktop browsers that don't support the Vibration API.
 * @param pattern - Duration in ms, or array of [on, off, on...] durations
 */
export function haptic(pattern: number | number[] = 8): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}
