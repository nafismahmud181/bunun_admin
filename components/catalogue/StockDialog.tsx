'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { adjustStockAction } from '@/app/(dashboard)/inventory/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Mode = 'add' | 'remove' | 'count';
const MODES: [Mode, string][] = [
  ['add', 'Add'],
  ['remove', 'Remove'],
  ['count', 'Set count'],
];
const REASONS: Record<Mode, string[]> = {
  add: ['New batch received', 'Customer return (resellable)'],
  remove: ['Damaged', 'Used as sample', 'Lost'],
  count: ['Stocktake'],
};

/** Change one variant's stock with a reason. Every change is kept in the stock history. */
export default function StockDialog({ sku, label, stock }: { sku: string; label: string; stock: number }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [pending, start] = useTransition();
  const n = Number(amount);
  const valid =
    amount !== '' && Number.isInteger(n) && (mode === 'count' ? n >= 0 : n > 0) && reason.trim().length >= 3;
  const after = mode === 'add' ? stock + n : mode === 'remove' ? stock - n : n;

  const save = () =>
    start(async () => {
      const r = await adjustStockAction({
        sku,
        reason: reason.trim(),
        ...(mode === 'count' ? { count: n } : { change: mode === 'add' ? n : -n }),
      });
      if (r.ok) {
        toast.success(`${label}: ${r.stock} in stock`);
        setOpen(false);
        setAmount('');
        setReason('');
      } else toast.error(r.error);
    });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Adjust
      </Button>
      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust stock</DialogTitle>
            <DialogDescription>
              {label} · <span className="font-mono">{sku}</span> · {stock} in stock now
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-1">
            {MODES.map(([m, text]) => (
              <Button key={m} size="sm" variant={mode === m ? 'default' : 'outline'} onClick={() => setMode(m)}>
                {text}
              </Button>
            ))}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="stock-amount">{mode === 'count' ? 'Units counted on the shelf' : 'Units'}</Label>
            <Input
              id="stock-amount"
              type="number"
              min={0}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="stock-reason">Reason</Label>
            <Input
              id="stock-reason"
              list="stock-reasons"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
            />
            <datalist id="stock-reasons">
              {REASONS[mode].map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
          {amount !== '' && Number.isInteger(n) && (
            <p className={`text-sm ${after < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {after < 0 ? `Only ${stock} in stock.` : `After this: ${after} in stock.`}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!valid || after < 0 || pending}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
