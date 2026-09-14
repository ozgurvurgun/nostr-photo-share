import {pickReadableOnColor, tuneAgainstBackground} from './color';
import {
  ACCENT_BASE,
  elevation,
  glass,
  layout,
  motion,
  radius,
  spacing,
  storyRingGradient,
  typography,
} from './tokens';
import type {Theme, ThemeColors} from './types';

const AA = 4.5;

function buildColors(
  background: ThemeColors['background'],
  text: ThemeColors['text'],
  border: ThemeColors['border'],
  accentToward: string,
  state: ThemeColors['state'],
  overlay: ThemeColors['overlay'],
): ThemeColors {
  const accent = tuneAgainstBackground(ACCENT_BASE, background.primary, accentToward, AA);
  return {
    background,
    text,
    border,
    accent: {
      primary: accent,
      onAccent: pickReadableOnColor(accent),
      muted: tuneAgainstBackground(ACCENT_BASE, background.primary, accentToward, 3),
    },
    state,
    overlay,
  };
}

const darkColors = buildColors(
  {
    primary: '#12110F',
    secondary: '#1B1A17',
    elevated: '#24221E',
    surface: '#1F1D19',
  },
  {
    primary: '#F4F0E6',
    secondary: '#B8B1A4',
    disabled: '#7A746A',
    inverse: '#1A1814',
  },
  {
    default: '#3A372F',
    subtle: '#2A2823',
    strong: '#524E44',
  },
  '#FFF3C4',
  {
    error: '#E06A5C',
    success: '#7FAE7A',
    warning: '#D4A054',
  },
  {
    scrim: glass.overlayDark,
    glassStroke: glass.strokeDark,
  },
);

const lightColors = buildColors(
  {
    primary: '#FAFAF8',
    secondary: '#F2F1ED',
    elevated: '#FFFFFF',
    surface: '#F5F4F0',
  },
  {
    primary: '#141311',
    secondary: '#5F5C56',
    disabled: '#9B978F',
    inverse: '#FAFAF8',
  },
  {
    default: '#E4E2DC',
    subtle: '#EEECE7',
    strong: '#C9C5BC',
  },
  '#3D2A08',
  {
    error: '#B42318',
    success: '#3B6D38',
    warning: '#8A5A12',
  },
  {
    scrim: glass.overlayLight,
    glassStroke: glass.strokeLight,
  },
);

export const darkTheme: Theme = {
  scheme: 'dark',
  colors: darkColors,
  typography,
  spacing,
  radius,
  motion,
  layout,
  elevation,
  glass,
  storyRingGradient,
};

export const lightTheme: Theme = {
  scheme: 'light',
  colors: lightColors,
  typography,
  spacing,
  radius,
  motion,
  layout,
  elevation,
  glass,
  storyRingGradient,
};

export function themeContrastPairs(theme: Theme): Array<[string, string]> {
  return [
    [theme.colors.text.primary, theme.colors.background.primary],
    [theme.colors.text.secondary, theme.colors.background.primary],
    [theme.colors.accent.primary, theme.colors.background.primary],
    [theme.colors.accent.onAccent, theme.colors.accent.primary],
  ];
}
