'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateCategoryAction } from '@/app/(dashboard)/categories/actions';
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
import type { components } from '@/lib/api/schema';

type Category = components['schemas']['AdminCategory'];
type Field = components['schemas']['VariantField'];

const WEIGHT: Field = { key: 'weight', label: 'Weight', unit: 'g' };
const PRESETS: Field[] = [
  { key: 'dimensions', label: 'Dimensions', unit: 'in' },
  { key: 'colour', label: 'Colour', unit: null },
  { key: 'material', label: 'Material', unit: null },
  { key: 'pieces', label: 'Pieces', unit: null },
];

/** "Fabric type" → "fabric_type"; made unique against the keys already used. */
function keyFor(label: string, taken: string[]) {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/^(\d)/, 'f$1')
      .slice(0, 24) || 'field';
  let key = base === 'weight' ? 'weight_2' : base;
  for (let n = 2; taken.includes(key); n++) key = `${base}_${n}`;
  return key;
}

/**
 * What each option (size) of a product in this category records, e.g. Dimensions for table
 * runners. Weight is the shipping weight couriers need; it is never shown to shoppers.
 */
export default function OptionFieldsDialog({ c }: { c: Category }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [optionLabel, setOptionLabel] = useState(c.optionLabel);
  const [fields, setFields] = useState<Field[]>(c.variantFields.filter((f) => f.key !== WEIGHT.key));
  const [weight, setWeight] = useState(c.variantFields.some((f) => f.key === WEIGHT.key));
  const reset = () => {
    setOptionLabel(c.optionLabel);
    setFields(c.variantFields.filter((f) => f.key !== WEIGHT.key));
    setWeight(c.variantFields.some((f) => f.key === WEIGHT.key));
  };
  const max = weight ? 5 : 6;
  const add = (f: Omit<Field, 'key'> & { key?: string }) =>
    setFields((list) => {
      const taken = list.map((x) => x.key);
      const key = f.key && !taken.includes(f.key) ? f.key : keyFor(f.label, taken);
      return [...list, { key, label: f.label, unit: f.unit ?? null }];
    });
  const update = (i: number, patch: Partial<Field>) =>
    setFields((list) => list.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const move = (i: number, by: -1 | 1) =>
    setFields((list) => {
      const j = i + by;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  const valid = optionLabel.trim() && fields.every((f) => f.label.trim());

  const save = () =>
    start(async () => {
      const variantFields = [
        ...fields.map((f) => ({ key: f.key, label: f.label.trim(), unit: f.unit?.trim() || null })),
        ...(weight ? [WEIGHT] : []),
      ];
      const r = await updateCategoryAction(c.id, { optionLabel: optionLabel.trim(), variantFields });
      if (!r.ok) return void toast.error(r.error);
      toast.success(`Options for ${c.name} saved`);
      setOpen(false);
    });

  const summary = [
    ...c.variantFields.filter((f) => f.key !== WEIGHT.key).map((f) => f.label),
    ...(c.variantFields.some((f) => f.key === WEIGHT.key) ? ['Weight'] : []),
  ].join(', ');

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        title={summary ? `Each ${c.optionLabel.toLowerCase()} records: ${summary}` : undefined}
      >
        Options
      </Button>
      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Options for {c.name}</DialogTitle>
            <DialogDescription>
              What each option of a product in this category records. The product page shows these details for the
              option a shopper picks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor={`ol-${c.id}`}>An option is called</Label>
              <Input
                id={`ol-${c.id}`}
                value={optionLabel}
                onChange={(e) => setOptionLabel(e.target.value)}
                maxLength={30}
                placeholder="Size"
              />
              <p className="text-xs text-muted-foreground">
                Shown on the product page, e.g. &quot;{optionLabel.trim() || 'Size'}: Large&quot;.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Details for each option</Label>
              {fields.length === 0 && <p className="text-sm text-muted-foreground">None: options have a name only.</p>}
              {fields.map((f, i) => (
                <div key={f.key} className="flex items-center gap-2">
                  <Input
                    value={f.label}
                    onChange={(e) => update(i, { label: e.target.value })}
                    maxLength={30}
                    aria-label={`Detail ${i + 1} name`}
                    placeholder="e.g. Dimensions"
                  />
                  <Input
                    value={f.unit ?? ''}
                    onChange={(e) => update(i, { unit: e.target.value })}
                    maxLength={12}
                    className="w-24"
                    aria-label={`Detail ${i + 1} unit`}
                    placeholder="unit"
                  />
                  <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={i === fields.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label="Move down"
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setFields(fields.filter((_, j) => j !== i))}
                    aria-label={`Remove ${f.label || 'detail'}`}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              {fields.length < max && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-xs text-muted-foreground">Add:</span>
                  {PRESETS.filter((p) => !fields.some((f) => f.key === p.key)).map((p) => (
                    <Button key={p.key} size="sm" variant="outline" onClick={() => add(p)}>
                      {p.label}
                    </Button>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => add({ label: 'New detail', unit: null })}>
                    Other…
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Units are added after the value, e.g. Dimensions 16 × 72 <b>in</b>.
              </p>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={weight} onChange={(e) => setWeight(e.target.checked)} />
              <span>
                Record the shipping weight (g)
                <span className="block text-xs text-muted-foreground">
                  For courier booking; shoppers don&apos;t see it.
                </span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending || !valid}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
