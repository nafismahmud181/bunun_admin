'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { resetContentAction, saveThemeAction, type ThemeColors } from '@/app/(dashboard)/content/actions';
import { useConfirm } from '@/components/ConfirmProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { contrast, themeVars } from '@/lib/theme';

type Key = keyof ThemeColors;

const FIELDS: { key: Key; label: string; hint: string }[] = [
  { key: 'primary', label: 'Main colour', hint: 'Header, buttons, links and prices' },
  { key: 'accent', label: 'Accent', hint: 'Search button, badges, stars, highlights' },
  { key: 'text', label: 'Text', hint: 'Body text, plus the top bar and newsletter strip' },
  { key: 'surface', label: 'Soft background', hint: 'Behind sections such as trust badges and reviews' },
  { key: 'border', label: 'Borders', hint: 'Lines around cards, inputs and tables' },
  { key: 'footer', label: 'Footer', hint: 'Footer background' },
];

export const PRESETS: { name: string; colors: ThemeColors }[] = [
  {
    name: 'Nakshi (original)',
    colors: {
      primary: '#6b1e2e',
      accent: '#b8860b',
      text: '#2a1a17',
      surface: '#fbf6ef',
      border: '#eadfd3',
      footer: '#2a1a17',
    },
  },
  {
    name: 'Indigo & brass',
    colors: {
      primary: '#1f3a5f',
      accent: '#b8862f',
      text: '#1c2430',
      surface: '#f4f1ea',
      border: '#e2dccf',
      footer: '#16202c',
    },
  },
  {
    name: 'Forest & gold',
    colors: {
      primary: '#1f4e3d',
      accent: '#a8842c',
      text: '#1b2620',
      surface: '#f3f5ef',
      border: '#dfe5da',
      footer: '#14211b',
    },
  },
  {
    name: 'Terracotta',
    colors: {
      primary: '#9c3d26',
      accent: '#b9772a',
      text: '#2b1d16',
      surface: '#fbf3ea',
      border: '#efdccb',
      footer: '#2b1d16',
    },
  },
  {
    name: 'Charcoal & mustard',
    colors: {
      primary: '#262626',
      accent: '#a87f12',
      text: '#1f1f1f',
      surface: '#f6f5f2',
      border: '#e5e3de',
      footer: '#111111',
    },
  },
];

const WHITE = '#ffffff';
const same = (a: ThemeColors, b: ThemeColors) => FIELDS.every(({ key }) => a[key] === b[key]);
const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s);

/** Readability problems, using the same shades the storefront will show. */
function warnings(t: ThemeColors) {
  const v = themeVars(t);
  const out: string[] = [];
  if (contrast(t.text, WHITE) < 4.5)
    out.push('Text is too light to read comfortably on white. Pick a darker text colour.');
  if (contrast(t.text, t.surface) < 4.5) out.push('Text is hard to read on the soft background.');
  if (contrast(t.primary, WHITE) < 3) out.push('Links and prices in the main colour are hard to see on white.');
  if (contrast(v['--on-green'], t.primary) < 3)
    out.push('Neither white nor the text colour reads well on the main colour (header and buttons).');
  if (contrast(v['--on-gold'], t.accent) < 3)
    out.push('Neither white nor the text colour reads well on the accent (search button and badges).');
  if (contrast(v['--footer-text'], t.footer) < 4.5) out.push('Footer text is hard to read. Pick a darker footer.');
  if (contrast(WHITE, t.text) < 4.5)
    out.push('The top bar and newsletter strip use the text colour behind white text.');
  return out;
}

export function ThemeEditor({ theme, isDefault }: { theme: ThemeColors; isDefault: boolean }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, start] = useTransition();
  const [colors, setColors] = useState(theme);
  // What the hex boxes show while someone is typing (only complete colours reach `colors`).
  const [typed, setTyped] = useState(theme);
  const dirty = !same(colors, theme);
  const problems = warnings(colors);

  const set = (key: Key, value: string) => {
    setTyped((t) => ({ ...t, [key]: value }));
    if (isHex(value)) setColors((c) => ({ ...c, [key]: value.toLowerCase() }));
  };
  const use = (c: ThemeColors) => {
    setColors(c);
    setTyped(c);
  };
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.error);
      toast.success(msg);
      router.refresh();
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="grid content-start gap-5">
        <div className="grid gap-2">
          <Label>Ready-made palettes</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => use(p.colors)}
                className={`flex items-center gap-3 rounded-lg border p-2 text-left text-sm hover:bg-muted ${
                  same(p.colors, colors) ? 'border-primary ring-1 ring-primary' : ''
                }`}
              >
                <span className="flex overflow-hidden rounded">
                  {FIELDS.map(({ key }) => (
                    <span key={key} className="h-6 w-4" style={{ background: p.colors[key] }} />
                  ))}
                </span>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <Label>Your colours</Label>
          {FIELDS.map(({ key, label, hint }) => (
            <div key={key} className="flex items-center gap-3">
              <input
                type="color"
                aria-label={label}
                value={colors[key]}
                onChange={(e) => set(key, e.target.value)}
                className="h-9 w-12 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
              />
              <Input
                aria-label={`${label} (hex)`}
                value={typed[key]}
                onChange={(e) => set(key, e.target.value.trim())}
                maxLength={7}
                className={`w-28 font-mono text-sm ${isHex(typed[key]) ? '' : 'border-destructive'}`}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{hint}</div>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Lighter and darker shades (button hover, muted text, soft tints) are worked out from these.
          </p>
        </div>

        {problems.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Some text may be hard to read</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {problems.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <p className="mt-1 text-xs">You can still save; the preview shows how it will look.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => run(() => saveThemeAction(colors), 'Colours saved')} disabled={pending || !dirty}>
            {pending ? 'Saving…' : 'Save and publish'}
          </Button>
          {dirty && (
            <Button variant="ghost" disabled={pending} onClick={() => use(theme)}>
              Undo changes
            </Button>
          )}
          {!isDefault && (
            <Button
              variant="ghost"
              disabled={pending}
              onClick={async () =>
                (await confirm({
                  title: 'Go back to the original colours?',
                  description: 'The store returns to the maroon and gold it was built with.',
                  action: 'Use the original',
                })) && run(() => resetContentAction('theme'), 'Back to the original colours')
              }
            >
              Use the original
            </Button>
          )}
          {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        </div>
      </div>

      <div className="grid content-start gap-2">
        <Label>Preview</Label>
        <StorePreview colors={colors} />
      </div>
    </div>
  );
}

/** A small mock of the storefront drawn with the same CSS variables the real store uses. */
function StorePreview({ colors }: { colors: ThemeColors }) {
  const vars = themeVars(colors) as React.CSSProperties;
  const v = (name: string) => `var(--${name})`;
  return (
    <div
      style={{ ...vars, color: v('ink'), fontFamily: 'Arial, sans-serif' }}
      className="overflow-hidden rounded-lg border bg-white text-[13px]"
    >
      <div style={{ background: v('ink'), color: v('on-ink-soft') }} className="px-4 py-1.5 text-[11px]">
        Free delivery over ৳3,000 · Cash on Delivery in all 64 districts
      </div>
      <div style={{ background: v('green') }} className="flex items-center gap-3 px-4 py-3">
        <span
          style={{ background: v('gold'), color: v('on-gold') }}
          className="grid size-8 place-items-center rounded font-bold"
        >
          B
        </span>
        <span className="leading-tight">
          <b style={{ color: v('on-green') }} className="block text-base">
            BGD Mart
          </b>
          <span style={{ color: v('gold-light') }} className="text-[9px] tracking-widest">
            HANDCRAFTED HOME DÉCOR
          </span>
        </span>
        <span className="ml-2 hidden flex-1 overflow-hidden rounded bg-white sm:flex">
          <span className="flex-1 px-2 py-1.5 text-[11px] text-neutral-400">Search…</span>
          <span style={{ background: v('gold'), color: v('on-gold') }} className="px-3 py-1.5 text-[11px] font-bold">
            Search
          </span>
        </span>
        <span style={{ color: v('on-green') }} className="ml-auto text-[11px]">
          <span style={{ color: v('on-green-soft') }} className="block text-[9px]">
            My Cart
          </span>
          <b>৳0</b>
        </span>
      </div>
      <div style={{ borderBottom: `1px solid ${v('line')}` }} className="flex gap-4 px-4 py-2 font-bold">
        <span style={{ color: v('green'), borderBottom: `2px solid ${v('green')}` }}>Home</span>
        <span>Table Runners</span>
        <span>Cushion Covers</span>
      </div>

      <div style={{ background: v('surface') }} className="grid gap-3 p-4 sm:grid-cols-[1.4fr_1fr]">
        <div style={{ background: v('green'), color: v('on-green') }} className="rounded p-4">
          <div style={{ color: v('gold-light') }} className="text-[10px] font-bold tracking-widest">
            FESTIVE SALE
          </div>
          <div className="my-1 text-lg font-bold leading-snug">
            Up to <em style={{ color: v('gold-light') }}>25% off</em> handcrafted runners
          </div>
          <p style={{ color: v('on-green-soft') }} className="text-[11px]">
            Pieces made by artisans in Jashore and Tangail.
          </p>
          <div className="mt-3 flex gap-2">
            <span
              style={{ background: v('gold'), color: v('on-gold') }}
              className="rounded px-3 py-1.5 text-[11px] font-bold"
            >
              Shop the Sale
            </span>
            <span
              style={{ border: `1px solid ${v('on-green')}` }}
              className="rounded px-3 py-1.5 text-[11px] font-bold"
            >
              Table Runners
            </span>
          </div>
        </div>
        <div style={{ border: `1px solid ${v('line')}` }} className="rounded bg-white">
          <div className="relative h-20" style={{ background: v('line-3') }}>
            <span
              style={{ background: v('gold'), color: v('on-gold') }}
              className="absolute left-2 top-2 px-1.5 py-0.5 text-[9px] font-bold"
            >
              NEW
            </span>
          </div>
          <div className="grid gap-1 p-2">
            <span className="font-medium">Nakshi table runner</span>
            <span style={{ color: v('star') }} className="text-[11px]">
              ★★★★★ <span style={{ color: v('muted-3') }}>(12)</span>
            </span>
            <span>
              <b style={{ color: v('green') }}>৳1,450</b>{' '}
              <s style={{ color: v('muted-3') }} className="text-[11px]">
                ৳1,800
              </s>
            </span>
            <span
              style={{ background: v('green'), color: v('on-green') }}
              className="rounded-full py-1 text-center text-[10px] font-bold"
            >
              ADD TO CART
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <p style={{ color: v('muted') }}>
          Body text in the muted shade, with a{' '}
          <a style={{ color: v('green') }} className="underline">
            link
          </a>
          .
        </p>
      </div>

      <div style={{ background: v('footer'), color: v('footer-text') }} className="px-4 py-3 text-[11px]">
        <b style={{ color: v('gold-light') }} className="tracking-wider">
          BGD MART
        </b>
        <span className="ml-3">House 12, Road 5, Dhanmondi, Dhaka</span>
        <div style={{ borderTop: `1px solid ${v('footer-line')}` }} className="mt-2 pt-2">
          © BGD Mart
        </div>
      </div>
    </div>
  );
}
