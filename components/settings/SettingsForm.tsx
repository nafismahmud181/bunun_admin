'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { saveSettingsAction } from '@/app/(dashboard)/settings/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { components } from '@/lib/api/schema';

type Settings = components['schemas']['AdminSettings'];
type Key = keyof Settings;

const FIELDS: { key: Key; label: string; hint?: string; number?: boolean }[] = [
  { key: 'store_name', label: 'Store name' },
  { key: 'hotline', label: 'Hotline', hint: 'Shown in the storefront header and in SMS.' },
  { key: 'store_address', label: 'Business address', hint: 'Printed on invoices.' },
  { key: 'store_email', label: 'Email' },
  { key: 'trade_licence', label: 'Trade licence number', hint: 'Printed on invoices.' },
  { key: 'free_delivery_threshold', label: 'Free delivery from ৳', number: true },
  {
    key: 'low_stock_threshold',
    label: 'Low stock at or below',
    hint: 'Units; for the low-stock list and dashboard.',
    number: true,
  },
  {
    key: 'order_limit_per_phone_24h',
    label: 'Online orders per phone number (24 hours)',
    hint: 'Fraud check: more are refused.',
    number: true,
  },
  { key: 'order_limit_per_ip_1h', label: 'Online orders per IP address (1 hour)', number: true },
];

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [form, setForm] = useState<Record<Key, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, String(settings[f.key])])) as Record<Key, string>,
  );
  const [pending, start] = useTransition();
  const changes: Partial<Settings> = {};
  for (const f of FIELDS) {
    const v = form[f.key].trim();
    if (v !== String(settings[f.key])) (changes as Record<string, unknown>)[f.key] = f.number ? Number(v) : v;
  }
  const dirty = Object.keys(changes).length > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="grid gap-1.5">
            <Label htmlFor={f.key}>{f.label}</Label>
            <Input
              id={f.key}
              type={f.number ? 'number' : 'text'}
              min={f.number ? 0 : undefined}
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
            {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
          </div>
        ))}
      </div>
      <Button
        disabled={!dirty || pending}
        onClick={() =>
          start(async () => {
            const r = await saveSettingsAction(changes);
            if (r.ok) toast.success('Settings saved');
            else toast.error(r.error);
          })
        }
      >
        {pending ? 'Saving…' : 'Save settings'}
      </Button>
    </div>
  );
}
