// Turns the six base colours staff pick in the admin (Content → Appearance) into every CSS
// variable in the storefront's globals.css. A copy of frontend/lib/theme.ts, used for the live
// preview on Content → Appearance: keep the two the same.
import type { components } from './api/schema';

type ThemeColors = components['schemas']['ThemeColors'];

type Rgb = [number, number, number];

const channel = (hex: string, i: number) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16);
const toRgb = (hex: string): Rgb => [channel(hex, 0), channel(hex, 1), channel(hex, 2)];
const toHex = (rgb: Rgb) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');

/** `a` moved `amount` (0–1) of the way towards `b`. */
function mix(a: string, b: string, amount: number) {
  const [x, y] = [toRgb(a), toRgb(b)];
  const step = (i: 0 | 1 | 2) => x[i] + (y[i] - x[i]) * amount;
  return toHex([step(0), step(1), step(2)]);
}

function luminance(hex: string) {
  const linear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = toRgb(hex);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast ratio, 1 to 21. Body text needs 4.5. */
export function contrast(a: string, b: string) {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const WHITE = '#ffffff';
const BLACK = '#000000';

/**
 * White text where it is readable (3:1, enough for the bold text on buttons, bars and badges),
 * otherwise the palette's text colour.
 */
const textOn = (bg: string, dark: string) => (contrast(WHITE, bg) >= 3 ? WHITE : dark);

export function themeVars(t: ThemeColors) {
  const onGreen = textOn(t.primary, t.text);
  return {
    '--green': t.primary,
    '--green-dark': mix(t.primary, BLACK, 0.27),
    '--green-tint': mix(t.surface, t.primary, 0.06),
    '--on-green': onGreen,
    '--on-green-soft': mix(onGreen, t.primary, 0.15),
    '--gold': t.accent,
    '--star': t.accent,
    '--gold-light': mix(t.accent, WHITE, 0.5),
    '--gold-dark': mix(t.accent, BLACK, 0.16),
    '--on-gold': textOn(t.accent, t.text),
    '--ink': t.text,
    '--ink-2': mix(t.text, WHITE, 0.08),
    '--muted': mix(t.text, WHITE, 0.22),
    '--muted-2': mix(t.text, WHITE, 0.3),
    '--muted-3': mix(t.text, WHITE, 0.5),
    '--on-ink-soft': mix(WHITE, t.text, 0.18),
    '--line': t.border,
    '--line-2': mix(t.border, t.text, 0.12),
    '--line-3': mix(t.border, WHITE, 0.4),
    '--surface': t.surface,
    '--footer': t.footer,
    '--footer-text': mix(WHITE, t.footer, 0.3),
    '--footer-line': mix(t.footer, WHITE, 0.15),
  };
}

/**
 * A rule that overrides the :root colours in globals.css (`html:root` wins on specificity).
 * Empty unless every colour is a plain #rrggbb, since the result goes into a <style> tag.
 */
export function themeCss(t: ThemeColors) {
  if (!Object.values(t).every((c) => /^#[0-9a-f]{6}$/i.test(c))) return '';
  const vars = Object.entries(themeVars(t))
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  return `html:root{${vars}}`;
}
