'use client';

import { useState } from 'react';
import { money, type Month } from '@/lib/profit';

// "Your money over the first year": one line, starting at minus the startup spend. Below ৳0 the
// owner is still earning back what they put in; above it is real profit. One series, so no legend.
const LINE = '#2a78d6';
const H = 220;
const PAD_TOP = 10;
const PAD_BOTTOM = 22;

/** Round axis limits (1, 2 or 5 × a power of ten). */
function nice(v: number) {
  if (v <= 0) return 0;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 5, 10].map((m) => m * p).find((m) => m >= v)!;
}

const short = (v: number) => {
  const a = Math.abs(v);
  const s =
    a >= 100_000 ? `${+(a / 100_000).toFixed(1)} lakh` : a >= 1000 ? `${Math.round(a / 1000)}k` : String(Math.round(a));
  return `${v < 0 ? '−' : ''}৳${s}`;
};

/** What a point means, in words. */
const say = (v: number) => (v < 0 ? `still ${money(-v)} to earn back` : `${money(v)} profit in your pocket`);

export default function CumulativeChart({ invest, months }: { invest: number; months: Month[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const points = [-invest, ...months.map((m) => m.cumulative)]; // index 0 = opening day
  const top = nice(Math.max(0, ...points)) || 1000;
  const bottom = -nice(-Math.min(0, ...points));
  const n = points.length;
  const x = (i: number) => (i / (n - 1)) * 100;
  const y = (v: number) => PAD_TOP + ((top - v) / (top - bottom)) * (H - PAD_TOP);
  // ৳0 always; the others only where they don't crowd a label already placed.
  const ticks = [0, top, top / 2, bottom, bottom / 2].reduce<number[]>(
    (kept, t) => (kept.every((k) => Math.abs(y(k) - y(t)) >= 26) ? [...kept, t] : kept),
    [],
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* Shade the "still paying back" zone below ৳0. */}
        <div
          className="pointer-events-none absolute inset-x-0 bg-red-500/5"
          style={{ top: y(0), height: Math.max(0, H - y(0)) }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 text-[11px] text-muted-foreground"
          style={{ height: H }}
        >
          {ticks.map((t) => (
            <div
              key={t}
              className={
                t === 0
                  ? 'absolute inset-x-0 border-t border-foreground/40'
                  : 'absolute inset-x-0 border-t border-dashed border-border/70'
              }
              style={{ top: y(t) }}
            >
              <span className={`absolute left-0 bg-card pr-1 ${y(t) > H - 12 ? '-top-4' : '-top-2'}`}>
                {t === 0 ? '৳0 — money back' : short(t)}
              </span>
            </div>
          ))}
        </div>
        <svg
          viewBox={`0 0 100 ${H + PAD_BOTTOM}`}
          preserveAspectRatio="none"
          className="block w-full"
          style={{ height: H + PAD_BOTTOM }}
          role="img"
          aria-label={`Your money over 12 months: ${say(points.at(-1)!)} after month 12`}
        >
          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD_TOP}
              y2={H}
              stroke="currentColor"
              className="text-muted-foreground/60"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          )}
          <polyline
            points={points.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            fill="none"
            stroke={LINE}
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {points.map((v, i) => (
            <rect
              key={i}
              x={Math.max(0, x(i) - 100 / (n - 1) / 2)}
              y={0}
              width={100 / (n - 1)}
              height={H}
              fill="transparent"
              tabIndex={0}
              aria-label={`${i === 0 ? 'Opening day' : `End of month ${i}`}: ${say(v)}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            />
          ))}
        </svg>
        <div
          className="pointer-events-none absolute inset-x-0 text-[11px] text-muted-foreground"
          style={{ top: H + 4 }}
        >
          {points.map((_, i) =>
            i % 2 === 0 ? (
              <span
                key={i}
                className={i === 0 ? 'absolute left-0' : i === n - 1 ? 'absolute right-0' : 'absolute -translate-x-1/2'}
                style={i === 0 || i === n - 1 ? undefined : { left: `${x(i)}%` }}
              >
                {i === 0 ? 'Opening' : `Month ${i}`}
              </span>
            ) : null,
          )}
        </div>
        {hover !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: `${Math.min(85, Math.max(15, x(hover)))}%`, top: 0 }}
          >
            <div className="font-medium text-foreground">
              {hover === 0 ? 'Opening day (startup money spent)' : `End of month ${hover}`}
            </div>
            <div className="text-muted-foreground">{say(points[hover]!)}</div>
          </div>
        )}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">Show as table</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-1 font-medium">When</th>
              <th className="py-1 text-right font-medium">Where you stand</th>
            </tr>
          </thead>
          <tbody>
            {points.map((v, i) => (
              <tr key={i} className="border-t">
                <td className="py-1">{i === 0 ? 'Opening day' : `End of month ${i}`}</td>
                <td className="py-1 text-right tabular-nums">{say(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
