import type { Metadata } from 'next';
import Link from 'next/link';
import ReviewCard from '@/components/marketing/ReviewCard';
import { buttonVariants } from '@/components/ui/button';
import { errorMessage } from '@/lib/api/client';
import { adminApi, requireAdmin } from '@/lib/session';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Reviews' };

const TABS = [
  ['pending', 'Waiting'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
] as const;
type Status = (typeof TABS)[number][0];

export default async function ReviewsPage({ searchParams }: PageProps<'/reviews'>) {
  const admin = await requireAdmin('products:write');
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? '';
  const status: Status = TABS.some(([s]) => s === one('status')) ? (one('status') as Status) : 'pending';
  const page = Math.max(1, Number(one('page')) || 1);
  const { data, error } = await (
    await adminApi()
  ).GET('/api/v1/admin/reviews', { params: { query: { status, page, limit: 20 }, header: {} } });
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const href = (s: Status, p = 1) => `/reviews?status=${s}${p > 1 ? `&page=${p}` : ''}`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Written by customers after delivery. A review shows on the product page once you approve it.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map(([s, label]) => (
          <Link
            key={s}
            href={href(s)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm',
              status === s ? 'bg-primary text-primary-foreground' : 'bg-background',
            )}
          >
            {label}
            {data && <span className="ml-1.5 tabular-nums opacity-70">{data.counts[s]}</span>}
          </Link>
        ))}
      </div>
      {error ? (
        <p className="text-sm text-destructive">{errorMessage(error, 'Could not load reviews.')}</p>
      ) : data?.items.length === 0 ? (
        <p className="rounded-lg border bg-background p-10 text-center text-sm text-muted-foreground">
          {status === 'pending' ? 'Nothing waiting. New reviews appear here.' : 'None yet.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {data?.items.map((r) => (
            <ReviewCard
              key={`${r.id}-${r.status}`}
              review={r}
              canSeeOrders={admin.permissions.includes('orders:read')}
            />
          ))}
        </ul>
      )}
      {data && data.total > data.limit && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={href(status, page - 1)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={href(status, page + 1)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
