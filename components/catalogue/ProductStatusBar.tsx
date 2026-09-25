'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { duplicateProductAction, updateProductAction } from '@/app/(dashboard)/products/actions';
import { Button, buttonVariants } from '@/components/ui/button';
import ProductStatusBadge from './ProductStatusBadge';

export default function ProductStatusBar({
  id,
  status,
  slug,
  storefrontUrl,
  canWrite,
}: {
  id: number;
  status: 'draft' | 'active' | 'archived';
  slug: string;
  storefrontUrl: string;
  canWrite: boolean;
}) {
  const [pending, start] = useTransition();
  const setStatus = (to: 'draft' | 'active' | 'archived', message: string) =>
    start(async () => {
      const r = await updateProductAction(id, { status: to });
      if (r.ok) toast.success(message);
      else toast.error(r.error);
    });
  const duplicate = () =>
    start(async () => {
      const r = await duplicateProductAction(id);
      if (r && !r.ok) toast.error(r.error);
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ProductStatusBadge status={status} />
      {status === 'active' && (
        <a
          href={`${storefrontUrl}/product/${slug}`}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          View on store ↗
        </a>
      )}
      {canWrite && (
        <>
          {status !== 'active' && (
            <Button
              size="sm"
              onClick={() => setStatus('active', 'Published: it is on the store now')}
              disabled={pending}
            >
              Publish
            </Button>
          )}
          {status === 'active' && (
            <Button size="sm" variant="outline" onClick={() => setStatus('draft', 'Unpublished')} disabled={pending}>
              Unpublish
            </Button>
          )}
          {status !== 'archived' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setStatus('archived', 'Archived')}
              disabled={pending}
            >
              Archive
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={duplicate} disabled={pending}>
            Duplicate
          </Button>
        </>
      )}
    </div>
  );
}
