'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  blockCustomerAction,
  saveCustomerNotesAction,
  unblockCustomerAction,
} from '@/app/(dashboard)/customers/actions';
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
import { Textarea } from '@/components/ui/textarea';

export function CustomerNotes({ id, notes, canWrite }: { id: number; notes: string | null; canWrite: boolean }) {
  const [value, setValue] = useState(notes ?? '');
  const [pending, start] = useTransition();
  if (!canWrite) return <p className="whitespace-pre-wrap text-sm">{notes || 'No notes.'}</p>;
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Notes for staff (the customer never sees these)"
        aria-label="Customer notes"
      />
      <Button
        size="sm"
        variant="secondary"
        disabled={pending || value.trim() === (notes ?? '')}
        onClick={() =>
          start(async () => {
            const r = await saveCustomerNotesAction(id, value);
            if (r.ok) toast.success('Notes saved');
            else toast.error(r.error);
          })
        }
      >
        {pending ? 'Saving…' : 'Save notes'}
      </Button>
    </div>
  );
}

export function BlockButton({ id, phone, blocked }: { id: number; phone: string; blocked: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, start] = useTransition();
  if (blocked)
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await unblockCustomerAction(id);
            if (r.ok) toast.success('Unblocked');
            else toast.error(r.error);
          })
        }
      >
        Unblock
      </Button>
    );
  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Block
      </Button>
      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block {phone}?</DialogTitle>
            <DialogDescription>
              They won&apos;t be able to order on the website. Staff can still take their orders by phone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="block-reason">Reason</Label>
            <Input
              id="block-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Refused 3 parcels"
              maxLength={200}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending || reason.trim().length < 3}
              onClick={() =>
                start(async () => {
                  const r = await blockCustomerAction(id, reason.trim());
                  if (r.ok) {
                    toast.success('Blocked');
                    setOpen(false);
                  } else toast.error(r.error);
                })
              }
            >
              Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
