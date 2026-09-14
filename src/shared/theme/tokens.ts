import type {TextStyle, ViewStyle} from 'react-native';

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
  xl: 28,
  full: 9999,
} as const;

export const motion = {
  duration: {
    micro: 180,
    short: 220,
    screen: 280,
    deliberate: 420,
  },
  easing: {
    enter: 'ease-out',
    exit: 'ease-in',
    standard: 'ease-in-out',
  },
} as const;

/** Soft card / sheet elevation (iOS shadow + Android elevation). */
export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  raised: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  sheet: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
  },
} as const satisfies Record<string, ViewStyle>;

/** Glass / overlay values for modals and frosted chrome. */
export const glass = {
  blurIntensity: 24,
  overlayDark: 'rgba(18, 17, 15, 0.72)',
  overlayLight: 'rgba(246, 243, 236, 0.72)',
  strokeDark: 'rgba(255, 255, 255, 0.08)',
  strokeLight: 'rgba(26, 24, 20, 0.08)',
} as const;

/** Non-color layout metrics shared across screens. */
export const layout = {
  storyAvatar: 64,
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
  headerControlSize: 40,
  feedCardMediaMinHeight: 320,
  tabBarHeight: 56,
  storyDismissThreshold: 120,
  storyAuthorSwipeThreshold: 80,
} as const;

/** Story ring gradient stops (Instagram/Damus-like unread cue). */
export const storyRingGradient = {
  start: '#F5A623',
  mid: '#C8922A',
  end: '#E06A5C',
} as const;

export const typography = {
  display: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  heading: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
  },
  bodyStrong: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0,
  },
  username: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0,
  },
  timestamp: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  button: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0,
  },
  badge: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;
