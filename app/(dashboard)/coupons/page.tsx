import type { Metadata } from 'next';
import Link from 'next/link';
import NewCouponButton from '@/components/marketing/NewCouponButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/api/client';
import { type Coupon, type CouponState, STATE_CLASS, STATE_LABEL } from '@/lib/coupons';
import { dhakaDate, taka } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Coupons' };

const STATES = Object.keys(STATE_LABEL) as CouponState[];

function rules(c: Coupon) {
  const r: string[] = [];
  if (c.minSubtotal) r.push(`from ${taka(c.minSubtotal)}`);
  if (c.firstOrderOnly) r.push('first order');
  r.push(c.perPhoneLimit === 1 ? 'once per phone' : `${c.perPhoneLimit}× per phone`);
  return r.join(' · ');
}

function dates(c: Coupon) {
  if (c.startsAt && c.endsAt) return `${dhakaDate(c.startsAt)} – ${dhakaDate(c.endsAt)}`;
  if (c.endsAt) return `until ${dhakaDate(c.endsAt)}`;
  if (c.startsAt) return `from ${dhakaDate(c.startsAt)}`;
  return 'No end date';
}

export default async function CouponsPage({ searchParams }: PageProps<'/coupons'>) {
  await requireAdmin('coupons:write');
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? '';
  const q = one('q').slice(0, 30);
  const state = STATES.includes(one('state') as CouponState) ? (one('state') as CouponState) : undefined;
  const { data, error } = await (
    await adminApi()
  ).GET('/api/v1/admin/coupons', {
    params: { query: { ...(q && { q }), ...(state && { state }) }, header: {} },
  });
  const tab = (s?: CouponState) => {
    const u = new URLSearchParams({ ...(q && { q }), ...(s && { state: s }) });
    return `/coupons${u.size ? `?${u}` : ''}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Coupons</h1>
        <NewCouponButton />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {[undefined, ...STATES].map((s) => (
          <Link
            key={s ?? 'all'}
            href={tab(s)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm',
              state === s ? 'bg-primary text-primary-foreground' : 'bg-background',
            )}
          >
            {s ? STATE_LABEL[s] : 'All'}
          </Link>
        ))}
        <form action="/coupons" className="ml-auto flex gap-2">
          {state && <input type="hidden" name="state" value={state} />}
          <Input name="q" defaultValue={q} placeholder="Code" className="w-40 bg-background" />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>
      {error ? (
        <p className="text-sm text-destructive">{errorMessage(error, 'Could not load coupons.')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Rules</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead className="text-right">Given away</TableHead>
                <TableHead>State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    {q || state ? 'No coupons match.' : 'No coupons yet. Create one for your next sale.'}
                  </TableCell>
                </TableRow>
              )}
              {data?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/coupons/${c.id}`} className="font-mono font-medium hover:underline">
                      {c.code}
                    </Link>
                    {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
                  </TableCell>
                  <TableCell>{c.summary}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{rules(c)}</TableCell>
                  <TableCell className="text-sm">{dates(c)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.usedCount}
                    {c.usageLimit !== null && <span className="text-muted-foreground"> / {c.usageLimit}</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{taka(c.saved)}</TableCell>
                  <TableCell>
                    <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', STATE_CLASS[c.state])}>
                      {STATE_LABEL[c.state]}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
