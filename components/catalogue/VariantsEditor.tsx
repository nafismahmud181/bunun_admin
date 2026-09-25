'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { addVariantAction, deleteVariantAction, updateVariantAction } from '@/app/(dashboard)/products/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { components } from '@/lib/api/schema';
import StockDialog from './StockDialog';

type Variant = components['schemas']['AdminVariant'];
type Row = { label: string; sku: string; price: string; compareAtPrice: string; weightGrams: string };

const toRow = (v: Variant): Row => ({
  label: v.label,
  sku: v.sku,
  price: String(v.price),
  compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : '',
  weightGrams: v.weightGrams ? String(v.weightGrams) : '',
});
const num = (s: string) => (s.trim() === '' ? null : Number(s));

function VariantRow({
  productId,
  v,
  canWrite,
  canStock,
}: {
  productId: number;
  v: Variant;
  canWrite: boolean;
  canStock: boolean;
}) {
  const [row, setRow] = useState(toRow(v));
  const [pending, start] = useTransition();
  const initial = toRow(v);
  const dirty = (Object.keys(row) as (keyof Row)[]).some((k) => row[k] !== initial[k]);
  const set = (k: keyof Row) => (e: { target: { value: string } }) => setRow((r) => ({ ...r, [k]: e.target.value }));

  const save = () =>
    start(async () => {
      const changes: Parameters<typeof updateVariantAction>[2] = {};
      if (row.label !== initial.label) changes.label = row.label.trim();
      if (row.sku !== initial.sku) changes.sku = row.sku.trim();
      if (row.price !== initial.price) changes.price = Number(row.price);
      if (row.compareAtPrice !== initial.compareAtPrice) changes.compareAtPrice = num(row.compareAtPrice);
      if (row.weightGrams !== initial.weightGrams) changes.weightGrams = num(row.weightGrams);
      const r = await updateVariantAction(productId, v.id, changes);
      if (r.ok) toast.success(`${row.label} saved`);
      else toast.error(r.error);
    });
  const remove = () =>
    start(async () => {
      if (!confirm(`Remove ${v.label} (${v.sku})? Orders that include it keep their copy.`)) return;
      const r = await deleteVariantAction(productId, v.id);
      if (!r.ok) toast.error(r.error);
    });

  const cell = 'h-8 min-w-0';
  return (
    <TableRow>
      <TableCell>
        <Input className={cell} value={row.label} onChange={set('label')} disabled={!canWrite} aria-label="Option" />
      </TableCell>
      <TableCell>
        <Input
          className={`${cell} font-mono text-xs`}
          value={row.sku}
          onChange={set('sku')}
          disabled={!canWrite}
          aria-label="SKU"
        />
      </TableCell>
      <TableCell>
        <Input
          className={cell}
          type="number"
          min={1}
          value={row.price}
          onChange={set('price')}
          disabled={!canWrite}
          aria-label="Price"
        />
      </TableCell>
      <TableCell>
        <Input
          className={cell}
          type="number"
          min={1}
          value={row.compareAtPrice}
          onChange={set('compareAtPrice')}
          disabled={!canWrite}
          aria-label="Old price"
          placeholder="—"
        />
      </TableCell>
      <TableCell>
        <Input
          className={cell}
          type="number"
          min={1}
          value={row.weightGrams}
          onChange={set('weightGrams')}
          disabled={!canWrite}
          aria-label="Weight (g)"
          placeholder="—"
        />
      </TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums">
        <span className={v.stock === 0 ? 'text-destructive' : ''}>{v.stock}</span>
        {canStock && (
          <span className="ml-2">
            <StockDialog sku={v.sku} label={v.label} stock={v.stock} />
          </span>
        )}
      </TableCell>
      {canWrite && (
        <TableCell className="whitespace-nowrap text-right">
          {dirty && (
            <Button size="sm" onClick={save} disabled={pending}>
              Save
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={remove} disabled={pending} aria-label={`Remove ${v.label}`}>
            ✕
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}

/** Sizes/options with their own SKU, price and stock. */
export default function VariantsEditor({
  productId,
  variants,
  canWrite,
  canStock,
}: {
  productId: number;
  variants: Variant[];
  canWrite: boolean;
  canStock: boolean;
}) {
  const empty = { label: '', sku: '', price: '', compareAtPrice: '', weightGrams: '', openingStock: '' };
  const [draft, setDraft] = useState(empty);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  const add = () =>
    start(async () => {
      const r = await addVariantAction(productId, {
        label: draft.label.trim(),
        ...(draft.sku.trim() && { sku: draft.sku.trim() }),
        price: Number(draft.price),
        compareAtPrice: num(draft.compareAtPrice),
        weightGrams: num(draft.weightGrams),
        openingStock: Number(draft.openingStock) || 0,
      });
      if (r.ok) {
        toast.success(`${draft.label} added`);
        setDraft(empty);
      } else toast.error(r.error);
    });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-32">Option</TableHead>
            <TableHead className="min-w-36">SKU</TableHead>
            <TableHead className="w-28">Price ৳</TableHead>
            <TableHead className="w-28">Old price ৳</TableHead>
            <TableHead className="w-28">Weight g</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            {canWrite && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((v) => (
            <VariantRow
              key={`${v.id}-${v.sku}-${v.price}-${v.label}`}
              productId={productId}
              v={v}
              canWrite={canWrite}
              canStock={canStock}
            />
          ))}
          {canWrite && (
            <TableRow className="bg-muted/40">
              <TableCell>
                <Input
                  className="h-8"
                  placeholder="e.g. Large"
                  value={draft.label}
                  onChange={set('label')}
                  aria-label="New option"
                />
              </TableCell>
              <TableCell>
                <Input
                  className="h-8 font-mono text-xs"
                  placeholder="auto"
                  value={draft.sku}
                  onChange={set('sku')}
                  aria-label="New SKU"
                />
              </TableCell>
              <TableCell>
                <Input
                  className="h-8"
                  type="number"
                  min={1}
                  value={draft.price}
                  onChange={set('price')}
                  aria-label="New price"
                />
              </TableCell>
              <TableCell>
                <Input
                  className="h-8"
                  type="number"
                  min={1}
                  value={draft.compareAtPrice}
                  onChange={set('compareAtPrice')}
                  aria-label="New old price"
                />
              </TableCell>
              <TableCell>
                <Input
                  className="h-8"
                  type="number"
                  min={1}
                  value={draft.weightGrams}
                  onChange={set('weightGrams')}
                  aria-label="New weight"
                />
              </TableCell>
              <TableCell>
                <Input
                  className="h-8 w-20 text-right"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={draft.openingStock}
                  onChange={set('openingStock')}
                  aria-label="Opening stock"
                />
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={add} disabled={pending || !draft.label.trim() || !(Number(draft.price) > 0)}>
                  Add
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {variants.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">Add at least one option with a price before publishing.</p>
      )}
    </div>
  );
}
