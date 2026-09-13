export type Rgb = {readonly r: number; readonly g: number; readonly b: number};

export function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function rgbToHex({r, g, b}: Rgb): string {
  const toByte = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel)))
      .toString(16)
      .padStart(2, '0');
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`.toUpperCase();
}

export function relativeLuminance(hex: string): number {
  const {r, g, b} = hexToRgb(hex);
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(first: string, second: string): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

export function mix(hex: string, toward: string, amount: number): string {
  const from = hexToRgb(hex);
  const to = hexToRgb(toward);
  return rgbToHex({
    r: from.r + (to.r - from.r) * amount,
    g: from.g + (to.g - from.g) * amount,
    b: from.b + (to.b - from.b) * amount,
  });
}

export function pickReadableOnColor(background: string): string {
  const whiteContrast = contrastRatio(background, '#FFFFFF');
  const blackContrast = contrastRatio(background, '#111111');
  return whiteContrast >= blackContrast ? '#FFFFFF' : '#111111';
}

export function tuneAgainstBackground(
  color: string,
  background: string,
  toward: string,
  minimumContrast: number,
): string {
  let current = color;
  for (let step = 0; step < 16; step += 1) {
    if (contrastRatio(current, background) >= minimumContrast) {
      return current;
    }
    current = mix(current, toward, 0.12);
  }
  return current;
}
