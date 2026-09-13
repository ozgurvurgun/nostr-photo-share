import type {layout, motion, radius, spacing, typography} from './tokens';

export type ThemeColors = {
  readonly background: {
    readonly primary: string;
    readonly secondary: string;
    readonly elevated: string;
  };
  readonly text: {
    readonly primary: string;
    readonly secondary: string;
    readonly disabled: string;
  };
  readonly border: {
    readonly default: string;
  };
  readonly accent: {
    readonly primary: string;
    readonly onAccent: string;
  };
  readonly state: {
    readonly error: string;
    readonly success: string;
    readonly warning: string;
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
};
