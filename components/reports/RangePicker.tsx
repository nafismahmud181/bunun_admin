import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Day arithmetic in Bangladesh time (UTC+6, no daylight saving), on YYYY-MM-DD strings.
const today = () => new Date(Date.now() + 6 * 3_600_000).toISOString().slice(0, 10);
const shift = (day: string, n: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const monthStart = (day: string) => `${day.slice(0, 7)}-01`;

export function presets() {
  const t = today();
  const thisMonth = monthStart(t);
  const lastMonthEnd = shift(thisMonth, -1);
  return [
    { key: '7d', label: 'Last 7 days', from: shift(t, -6), to: t },
    { key: '30d', label: 'Last 30 days', from: shift(t, -29), to: t },
    { key: '90d', label: 'Last 90 days', from: shift(t, -89), to: t },
    { key: 'month', label: 'This month', from: thisMonth, to: t },
    { key: 'last-month', label: 'Last month', from: monthStart(lastMonthEnd), to: lastMonthEnd },
    { key: 'year', label: 'This year', from: `${t.slice(0, 4)}-01-01`, to: t },
  ];
}

/** Quick ranges plus a custom from–to; everything is in the URL, so a report can be bookmarked or shared. */
export default function RangePicker({ from, to }: { from: string; to: string }) {
  const list = presets();
  return (
    <div className="flex flex-wrap items-end gap-2">
      {list.map((p) => (
        <Link
          key={p.key}
          href={`/reports?from=${p.from}&to=${p.to}`}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm',
            p.from === from && p.to === to ? 'bg-primary text-primary-foreground' : 'bg-background',
          )}
        >
          {p.label}
        </Link>
      ))}
      <form key={`${from}-${to}`} action="/reports" className="ml-auto flex flex-wrap items-end gap-2">
        <label className="text-xs text-muted-foreground">
          From
          <Input type="date" name="from" defaultValue={from} max={today()} className="bg-background" />
        </label>
        <label className="text-xs text-muted-foreground">
          To
          <Input type="date" name="to" defaultValue={to} max={today()} className="bg-background" />
        </label>
        <Button type="submit" variant="secondary">
          Show
        </Button>
      </form>
    </div>
  );
}
