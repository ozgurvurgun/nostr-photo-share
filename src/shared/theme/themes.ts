import {pickReadableOnColor, tuneAgainstBackground} from './color';
import {ACCENT_BASE, layout, motion, radius, spacing, typography} from './tokens';
import type {Theme, ThemeColors} from './types';

const AA = 4.5;

function buildColors(
  background: {primary: string; secondary: string; elevated: string},
  text: {primary: string; secondary: string; disabled: string},
  border: string,
  accentToward: string,
  state: ThemeColors['state'],
): ThemeColors {
  const accent = tuneAgainstBackground(ACCENT_BASE, background.primary, accentToward, AA);
  return {
    background,
    text,
    border: {default: border},
    accent: {
      primary: accent,
      onAccent: pickReadableOnColor(accent),
    },
    state,
  };
}

const darkColors = buildColors(
  {
    primary: '#12110F',
    secondary: '#1B1A17',
    elevated: '#24221E',
  },
  {
    primary: '#F4F0E6',
    secondary: '#B8B1A4',
    disabled: '#7A746A',
  },
  '#3A372F',
  '#FFF3C4',
  {
    error: '#E06A5C',
    success: '#7FAE7A',
    warning: '#D4A054',
  },
);

const lightColors = buildColors(
  {
    primary: '#F6F3EC',
    secondary: '#EBE6DB',
    elevated: '#FFFFFF',
  },
  {
    primary: '#1A1814',
    secondary: '#5C574E',
    disabled: '#9A9488',
  },
  '#D8D2C6',
  '#3D2A08',
  {
    error: '#B42318',
    success: '#3B6D38',
    warning: '#8A5A12',
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
};

export const lightTheme: Theme = {
  scheme: 'light',
  colors: lightColors,
  typography,
  spacing,
  radius,
  motion,
  layout,
};

export function themeContrastPairs(theme: Theme): Array<[string, string]> {
  return [
    [theme.colors.text.primary, theme.colors.background.primary],
    [theme.colors.text.secondary, theme.colors.background.primary],
    [theme.colors.accent.primary, theme.colors.background.primary],
    [theme.colors.accent.onAccent, theme.colors.accent.primary],
  ];
}
