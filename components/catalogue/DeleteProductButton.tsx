'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { deleteProductAction } from '@/app/(dashboard)/products/actions';
import { useConfirm } from '@/components/ConfirmProvider';
import { Button } from '@/components/ui/button';

/**
 * Deletes a product for good. Products that are in an order can't be deleted (archive them
 * instead); pass `orderCount` when known so the button explains that up front.
 */
export default function DeleteProductButton({
  id,
  name,
  orderCount,
  afterDelete,
  size = 'sm',
}: {
  id: number;
  name: string;
  orderCount?: number;
  afterDelete?: string;
  size?: 'sm' | 'xs';
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const confirm = useConfirm();
  const ordered = (orderCount ?? 0) > 0;
  return (
    <Button
      size={size}
      variant="ghost"
      className="text-destructive"
      disabled={pending || ordered}
      title={ordered ? 'This product is in orders, so it can only be archived.' : undefined}
      onClick={async () =>
        (await confirm({
          title: `Delete "${name}"?`,
          description: 'Its options, photos and stock history are removed for good. This can’t be undone.',
          action: 'Delete product',
          destructive: true,
        })) &&
        start(async () => {
          const r = await deleteProductAction(id);
          if (!r.ok) return void toast.error(r.error);
          toast.success(`${name} deleted`);
          if (afterDelete) router.push(afterDelete);
          else router.refresh();
        })
      }
    >
      {pending ? 'Deleting…' : 'Delete'}
    </Button>
  );
}
