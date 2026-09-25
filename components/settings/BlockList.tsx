'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { addBlockedAction, removeBlockedAction } from '@/app/(dashboard)/settings/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { components } from '@/lib/api/schema';
import { dhakaDate } from '@/lib/orders';

type Blocked = components['schemas']['BlockedContact'];

/** Phone numbers and IP addresses that can't order on the website. */
export default function BlockList({ items }: { items: Blocked[] }) {
  const [kind, setKind] = useState<'phone' | 'ip'>('phone');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(msg);
        after?.();
      } else toast.error(r.error);
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={kind}
          onChange={(e) => setKind(e.target.value as 'phone' | 'ip')}
          aria-label="Type"
        >
          <option value="phone">Phone</option>
          <option value="ip">IP address</option>
        </select>
        <Input
          className="w-44"
          placeholder={kind === 'phone' ? '01XXXXXXXXX' : '203.0.113.7'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Value"
        />
        <Input
          className="w-64"
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          aria-label="Reason"
        />
        <Button
          disabled={pending || value.trim().length < 3 || reason.trim().length < 3}
          onClick={() =>
            run(
              () => addBlockedAction(kind, value.trim(), reason.trim()),
              'Blocked',
              () => {
                setValue('');
                setReason('');
              },
            )
          }
        >
          Block
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody is blocked.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Blocked</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Since</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <span className="mr-2 text-xs text-muted-foreground">{b.kind === 'ip' ? 'IP' : 'Phone'}</span>
                  <span className="font-mono">{b.value}</span>
                </TableCell>
                <TableCell>{b.reason}</TableCell>
                <TableCell>{dhakaDate(b.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => run(() => removeBlockedAction(b.id), 'Unblocked')}
                  >
                    Unblock
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
