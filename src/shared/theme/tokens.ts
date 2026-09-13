import type {TextStyle} from 'react-native';

export const ACCENT_BASE = '#C8922A';

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screenEdge: 16,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 9999,
} as const;

export const motion = {
  duration: {
    micro: 180,
    screen: 280,
  },
  easing: {
    enter: 'ease-out',
    exit: 'ease-in',
  },
} as const;

/** Non-color layout metrics shared across screens. */
export const layout = {
  storyAvatar: 56,
  storyRingWidth: 3,
  storyRingGap: 8,
  storyDwellMs: 5_000,
  storyProgressHeight: 3,
  storyTapZoneFraction: 0.35,
  hitSlop: 12,
  mediaPreviewHeight: 220,
  captionMinHeight: 96,
  storyCaptionMinHeight: 72,
  composerMinHeight: 48,
  composerMaxHeight: 120,
  skeletonLabelWidth: 48,
  skeletonLabelHeight: 10,
} as const;

export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  heading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: 0,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;
