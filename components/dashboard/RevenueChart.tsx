'use client';

import { useState } from 'react';
import { taka } from '@/lib/orders';

type Day = { day: string; orders: number; revenue: number };

// One series (daily revenue), so one color and no legend; the card title names it.
// Palette slot 1 of the validated reference palette, checked against the white card surface.
const SERIES = '#2a78d6';
const H = 180; // plot height
const PAD_TOP = 8;
const PAD_BOTTOM = 22; // room for the date labels

const label = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${iso}T00:00:00+06:00`).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka', ...opts });

/** A nice round top for the y-axis (1, 2 or 5 × a power of ten). */
function niceMax(v: number) {
  if (v <= 0) return 1000;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 5, 10].map((m) => m * p).find((m) => m >= v)!;
}

const todayInDhaka = () => new Date(Date.now() + 6 * 3_600_000).toISOString().slice(0, 10);

/**
 * Revenue per day (or per month). Used by the dashboard (last 30 days) and the Reports page (any
 * range); `bucket` says what one column is.
 */
export default function RevenueChart({ days, bucket = 'day' }: { days: Day[]; bucket?: 'day' | 'month' }) {
  const [hover, setHover] = useState<number | null>(null);
  const monthly = bucket === 'month';
  const short = (iso: string) =>
    label(iso, monthly ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' });
  const long = (iso: string) =>
    label(iso, monthly ? { month: 'long', year: 'numeric' } : { weekday: 'short', day: 'numeric', month: 'short' });
  const endsToday = !monthly && days.at(-1)?.day === todayInDhaka();
  const max = niceMax(Math.max(...days.map((d) => d.revenue)));
  const n = days.length;
  const slot = 100 / n; // percent of the width per day
  const barW = Math.min(slot * 0.62, 100); // leave air between columns
  const y = (v: number) => PAD_TOP + (1 - v / max) * (H - PAD_TOP);
  const total = days.reduce((a, d) => a + d.revenue, 0);
  const h = hover === null ? null : days[hover]!;

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* Recessive grid: three lines with values in muted ink. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 text-[11px] text-muted-foreground"
          style={{ height: H }}
        >
          {[1, 0.5, 0].map((f) => (
            <div
              key={f}
              className="absolute inset-x-0 border-t border-dashed border-border/70"
              style={{ top: y(max * f) }}
            >
              <span className="absolute -top-2 left-0 bg-card pr-1">{f === 0 ? '' : taka(max * f)}</span>
            </div>
          ))}
        </div>
        <svg
          viewBox={`0 0 100 ${H + PAD_BOTTOM}`}
          preserveAspectRatio="none"
          className="block h-[202px] w-full"
          role="img"
          aria-label={`Revenue per ${monthly ? 'month' : 'day'}, ${taka(total)} in total`}
        >
          {days.map((d, i) => {
            const x = i * slot + (slot - barW) / 2;
            const top = y(d.revenue);
            const hgt = H - top;
            return (
              <g key={d.day}>
                {/* Column: rounded end at the top, square at the baseline. */}
                {d.revenue > 0 && (
                  <path
                    d={`M${x},${H} V${top + Math.min(4, hgt)} Q${x},${top} ${x + Math.min(1, barW / 2)},${top} H${x + barW - Math.min(1, barW / 2)} Q${x + barW},${top} ${x + barW},${top + Math.min(4, hgt)} V${H} Z`}
                    fill={SERIES}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                )}
                {/* Hit target: the whole day's slot, taller than the column. */}
                <rect
                  x={i * slot}
                  y={0}
                  width={slot}
                  height={H}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  aria-label={`${short(d.day)}: ${taka(d.revenue)}, ${d.orders} orders`}
                />
              </g>
            );
          })}
          <line
            x1={0}
            x2={100}
            y1={H}
            y2={H}
            stroke="currentColor"
            className="text-border"
            strokeWidth={0.3}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* Labels every 7 days (or every month) counting back from the end, so none crowd the last one. */}
        <div
          className="pointer-events-none absolute inset-x-0 text-[11px] text-muted-foreground"
          style={{ top: H + 4 }}
        >
          {days.map((d, i) =>
            (n - 1 - i) % (monthly ? Math.max(1, Math.ceil(n / 8)) : n <= 35 ? 7 : Math.ceil(n / 6)) === 0 ? (
              <span
                key={d.day}
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${(i + 0.5) * slot}%` }}
              >
                {i === n - 1 && endsToday ? 'Today' : short(d.day)}
              </span>
            ) : null,
          )}
        </div>
        {h && hover !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: `${Math.min(92, Math.max(8, (hover + 0.5) * slot))}%`, top: Math.max(0, y(h.revenue) - 52) }}
          >
            <div className="font-medium text-foreground">{long(h.day)}</div>
            <div className="text-muted-foreground">
              {taka(h.revenue)} · {h.orders} order{h.orders === 1 ? '' : 's'}
            </div>
          </div>
        )}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">Show as table</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-1 font-medium">{monthly ? 'Month' : 'Day'}</th>
              <th className="py-1 text-right font-medium">Orders</th>
              <th className="py-1 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {[...days].reverse().map((d) => (
              <tr key={d.day} className="border-t">
                <td className="py-1">{long(d.day)}</td>
                <td className="py-1 text-right tabular-nums">{d.orders}</td>
                <td className="py-1 text-right tabular-nums">{taka(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
