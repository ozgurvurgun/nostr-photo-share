import {contrastRatio} from './color';
import {darkTheme, lightTheme, themeContrastPairs} from './themes';

describe('design tokens', () => {
  it.each([
    ['dark', darkTheme],
    ['light', lightTheme],
  ])('%s theme text and accent pairs meet WCAG AA', (_name, theme) => {
    for (const [foreground, background] of themeContrastPairs(theme)) {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('uses the 8pt spacing grid and declared type scale', () => {
    expect(Object.values(darkTheme.spacing).every(value => value % 4 === 0)).toBe(true);
    expect(darkTheme.typography.display.fontSize).toBe(26);
    expect(darkTheme.typography.body.lineHeight).toBe(22);
    expect(darkTheme.typography.button.fontWeight).toBe('600');
    expect(darkTheme.typography.username.fontSize).toBe(14);
    expect(darkTheme.radius.md).toBe(12);
    expect(darkTheme.elevation.card.elevation).toBe(3);
    expect(darkTheme.colors.background.surface).toBeTruthy();
    expect(darkTheme.glass.blurIntensity).toBeGreaterThan(0);
    expect(darkTheme.storyRingGradient.mid).toBeTruthy();
  });
});
