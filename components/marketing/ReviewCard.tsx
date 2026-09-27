'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { deleteReviewAction, moderateReviewAction } from '@/app/(dashboard)/reviews/actions';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ConfirmProvider';
import type { components } from '@/lib/api/schema';
import { imgSrc } from '@/lib/images';
import { dhakaDateTime } from '@/lib/orders';

type Review = components['schemas']['AdminReview'];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}
      <span className="text-muted-foreground/40">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

export default function ReviewCard({ review: r, canSeeOrders }: { review: Review; canSeeOrders: boolean }) {
  const [pending, start] = useTransition();
  const confirm = useConfirm();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) toast.success(msg);
      else toast.error(res.error);
    });

  return (
    <li className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Stars rating={r.rating} />
          <div className="text-sm">
            <b>{r.name}</b>
            {r.city && <span className="text-muted-foreground"> · {r.city}</span>}
            <span className="text-muted-foreground"> · {dhakaDateTime(r.createdAt)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <Link href={`/products/${r.product.id}`} className="hover:underline">
              {r.product.name}
            </Link>
            {r.orderNo && (
              <>
                {' · order '}
                {canSeeOrders ? (
                  <Link href={`/orders/${r.orderNo}`} className="hover:underline">
                    {r.orderNo}
                  </Link>
                ) : (
                  r.orderNo
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {r.status !== 'approved' && (
            <Button
              size="sm"
              disabled={pending}
              onClick={() => run(() => moderateReviewAction(r.id, 'approved'), 'Approved: now on the product page')}
            >
              Approve
            </Button>
          )}
          {r.status !== 'rejected' && (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => moderateReviewAction(r.id, 'rejected'), 'Rejected')}
            >
              Reject
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            disabled={pending}
            onClick={async () =>
              (await confirm({
                title: 'Delete this review?',
                description: 'The review and its photos are removed for good.',
                action: 'Delete',
                destructive: true,
              })) && run(() => deleteReviewAction(r.id), 'Review deleted')
            }
          >
            Delete
          </Button>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm">{r.body}</p>
      {r.images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {r.images.map((url) => (
            <a key={url} href={imgSrc(url, 1200)} target="_blank" rel="noreferrer" title="Open full size">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc(url, 400)} alt="Photo from the customer" className="size-24 rounded-md object-cover" />
            </a>
          ))}
        </div>
      )}
      {r.moderatedBy && r.moderatedAt && (
        <p className="text-xs text-muted-foreground">
          {r.status === 'approved' ? 'Approved' : 'Rejected'} by {r.moderatedBy}, {dhakaDateTime(r.moderatedAt)}
        </p>
      )}
    </li>
  );
}
