'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { changeStatusAction } from '@/app/(dashboard)/orders/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ACTION_LABEL, STATUS_LABEL, type OrderStatus } from '@/lib/orders';

// What happens next, shown in the confirmation dialog.
const EFFECT: Partial<Record<OrderStatus, string>> = {
  confirmed: 'The customer gets an SMS that the order is confirmed.',
  shipped: 'The customer gets an SMS that the order is on its way, with the amount to pay the courier.',
  delivered: 'Cash on Delivery orders are marked paid.',
  cancelled: 'The items go back into stock and the customer gets an SMS that the order was cancelled.',
  returned: 'Choose whether the items go back into stock.',
};
const DANGER = new Set<OrderStatus>(['cancelled', 'returned', 'refunded']);

export default function StatusActions({ orderNo, allowed }: { orderNo: string; allowed: OrderStatus[] }) {
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState('');
  const [restock, setRestock] = useState(true);
  const [pending, start] = useTransition();

  if (allowed.length === 0) return <p className="text-sm text-muted-foreground">No further steps for this order.</p>;

  const submit = () =>
    start(async () => {
      if (!target) return;
      const r = await changeStatusAction(orderNo, { to: target, note, restock });
      if (r.ok) {
        toast.success(`Order ${STATUS_LABEL[target].toLowerCase()}`);
        setTarget(null);
        setNote('');
        setRestock(true);
      } else toast.error(r.error);
    });

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allowed.map((s) => (
          <Button key={s} variant={DANGER.has(s) ? 'destructive' : 'default'} onClick={() => setTarget(s)}>
            {ACTION_LABEL[s]}
          </Button>
        ))}
      </div>
      <Dialog open={target !== null} onOpenChange={(open) => !open && !pending && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{target && ACTION_LABEL[target]}?</DialogTitle>
            <DialogDescription>{target && EFFECT[target]}</DialogDescription>
          </DialogHeader>
          {target === 'returned' && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
              Put the items back in stock (untick for damaged goods)
            </label>
          )}
          <div className="space-y-2">
            <Label htmlFor="status-note">Note (optional, kept in the order history)</Label>
            <Textarea
              id="status-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={pending}>
              Back
            </Button>
            <Button
              variant={target && DANGER.has(target) ? 'destructive' : 'default'}
              onClick={submit}
              disabled={pending}
            >
              {pending ? 'Saving…' : target ? ACTION_LABEL[target] : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
