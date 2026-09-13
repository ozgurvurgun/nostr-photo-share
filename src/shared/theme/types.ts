import type {
  elevation,
  glass,
  layout,
  motion,
  radius,
  spacing,
  storyRingGradient,
  typography,
} from './tokens';

export type ThemeColors = {
  readonly background: {
    readonly primary: string;
    readonly secondary: string;
    readonly elevated: string;
    /** Soft surface between secondary and elevated (cards, chips). */
    readonly surface: string;
  };
  readonly text: {
    readonly primary: string;
    readonly secondary: string;
    readonly disabled: string;
    readonly inverse: string;
  };
  readonly border: {
    readonly default: string;
    readonly subtle: string;
    readonly strong: string;
  };
  readonly accent: {
    readonly primary: string;
    readonly onAccent: string;
    readonly muted: string;
  };
  readonly state: {
    readonly error: string;
    readonly success: string;
    readonly warning: string;
  };
  readonly overlay: {
    readonly scrim: string;
    readonly glassStroke: string;
  };
};

export type Theme = {
  readonly scheme: 'light' | 'dark';
  readonly colors: ThemeColors;
  readonly typography: typeof typography;
  readonly spacing: typeof spacing;
  readonly radius: typeof radius;
  readonly motion: typeof motion;
  readonly layout: typeof layout;
  readonly elevation: typeof elevation;
  readonly glass: typeof glass;
  readonly storyRingGradient: typeof storyRingGradient;
};
