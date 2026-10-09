'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { resetDataAction, type DataResetInput } from '@/app/(dashboard)/settings/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Part = 'orders' | 'customers' | 'coupons' | 'auditLog' | 'sessions';

const PARTS: { key: Part; label: string; hint: string }[] = [
  {
    key: 'orders',
    label: 'Orders',
    hint: 'With their shipments, SMS, reviews (and photos) and coupon uses. Stock they took is put back. Parcels already booked with Pathao are not cancelled there.',
  },
  { key: 'customers', label: 'Customers and carts', hint: 'Customers who still have orders are kept.' },
  { key: 'coupons', label: 'Coupons', hint: 'Every coupon code.' },
  { key: 'auditLog', label: 'Audit log', hint: 'One new entry records this reset.' },
  { key: 'sessions', label: 'Admin sessions', hint: 'Signs out everyone else. You stay signed in.' },
];

const ALL: Record<Part, boolean> = { orders: true, customers: true, coupons: true, auditLog: true, sessions: true };

/** Deletes test data after a fresh two-factor code and the word RESET. Owner only. */
export default function DangerZone() {
  const [parts, setParts] = useState(ALL);
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, start] = useTransition();
  const chosen = PARTS.filter((p) => parts[p.key]);
  const ready = chosen.length > 0 && /^\d{6}$/.test(code) && confirm === 'RESET';

  const submit = () =>
    start(async () => {
      const r = await resetDataAction({ ...parts, code, confirm: 'RESET' } satisfies DataResetInput);
      setCode('');
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      const d = r.result.deleted;
      const summary = [
        parts.orders && `${d.orders} orders (${d.stockReturned} units of stock put back)`,
        parts.customers && `${d.customers} customers, ${d.carts} carts`,
        parts.coupons && `${d.coupons} coupons`,
        parts.auditLog && `${d.auditEntries} audit entries`,
        parts.sessions && `${d.sessions} sessions`,
      ]
        .filter(Boolean)
        .join(', ');
      toast.success(`Deleted ${summary}.${r.result.orderNumbersRestarted ? ' Order numbers start again at 1.' : ''}`);
      setConfirm('');
    });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Deletes data for good; there is no undo. Products, categories, images, stock levels, settings, delivery zones,
        content, the block list and staff accounts are never touched.
      </p>
      <div className="space-y-2">
        {PARTS.map((p) => (
          <label key={p.key} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={parts[p.key]}
              onChange={(e) => setParts((s) => ({ ...s, [p.key]: e.target.checked }))}
            />
            <span>
              <span className="font-medium">{p.label}</span>
              <span className="block text-xs text-muted-foreground">{p.hint}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="reset-code">Authenticator code</Label>
          <Input
            id="reset-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            className="w-32 font-mono tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reset-confirm">Type RESET</Label>
          <Input
            id="reset-confirm"
            autoComplete="off"
            className="w-32 font-mono"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <Button variant="destructive" disabled={pending || !ready} onClick={submit}>
          {pending ? 'Deleting…' : 'Delete selected data'}
        </Button>
      </div>
    </div>
  );
}
