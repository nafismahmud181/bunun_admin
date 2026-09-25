import { taka } from '@/lib/orders';

type Row = { name: string; qty: number; revenue: number };
const SERIES = '#2a78d6'; // same single series color as the revenue chart

/** Units sold per product (last 30 days) as thin horizontal bars, value at the tip in ink. */
export default function TopProducts({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No sales in the last 30 days.</p>;
  const max = Math.max(...rows.map((r) => r.qty));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.name} className="space-y-1">
          <div className="flex justify-between gap-2 text-sm">
            <span className="truncate">{r.name}</span>
            <span className="whitespace-nowrap text-muted-foreground tabular-nums">{taka(r.revenue)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 flex-1">
              <div
                className="h-full rounded-r-[4px]"
                style={{ width: `${Math.max(2, (r.qty / max) * 100)}%`, background: SERIES }}
              />
            </div>
            <span className="w-14 text-right text-xs tabular-nums text-foreground">{r.qty} sold</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
