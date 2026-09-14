import {t} from './i18n';

/** Compact counts for stats and trend rows (12.8K, 4.4K). */
export function formatCompactCount(count: number): string {
  if (count < 1000) {
    return String(count);
  }
  if (count < 1_000_000) {
    const value = count / 1000;
    const rounded = value >= 10 ? value.toFixed(0) : value.toFixed(1);
    return `${rounded.replace(/\.0$/, '')}K`;
  }
  const value = count / 1_000_000;
  const rounded = value >= 10 ? value.toFixed(0) : value.toFixed(1);
  return `${rounded.replace(/\.0$/, '')}M`;
}

export function shortNpub(npub: string): string {
  if (npub.length < 12) {
    return npub;
  }
  return `${npub.slice(0, 5)}...${npub.slice(-4)}`;
}

export function formatRelativeTime(createdAtSec: number, nowSec: number): string {
  const delta = Math.max(0, nowSec - createdAtSec);
  if (delta < 60) {
    return t('feed.timeSec', {count: delta});
  }
  if (delta < 3600) {
    return t('feed.timeMin', {count: Math.floor(delta / 60)});
  }
  if (delta < 86_400) {
    return t('feed.timeHour', {count: Math.floor(delta / 3600)});
  }
  if (delta < 86_400 * 7) {
    return t('feed.timeDay', {count: Math.floor(delta / 86_400)});
  }
  return t('feed.timeWeek', {count: Math.floor(delta / (86_400 * 7))});
}

export function formatRelativeTimeLong(createdAtSec: number, nowSec: number): string {
  const delta = Math.max(0, nowSec - createdAtSec);
  if (delta < 60) {
    return t('feed.timeSecLong', {count: delta});
  }
  if (delta < 3600) {
    return t('feed.timeMinLong', {count: Math.floor(delta / 60)});
  }
  if (delta < 86_400) {
    return t('feed.timeHourLong', {count: Math.floor(delta / 3600)});
  }
  if (delta < 86_400 * 7) {
    return t('feed.timeDayLong', {count: Math.floor(delta / 86_400)});
  }
  return t('feed.timeWeekLong', {count: Math.floor(delta / (86_400 * 7))});
}

export function hostFromRelayUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^wss?:\/\//i, '').split('/')[0] ?? url;
  }
}
