'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { addVariantAction, deleteVariantAction, updateVariantAction } from '@/app/(dashboard)/products/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConfirm } from '@/components/ConfirmProvider';
import type { components } from '@/lib/api/schema';
import StockDialog from './StockDialog';

type Variant = components['schemas']['AdminVariant'];
type Field = components['schemas']['VariantField'];
type Row = {
  label: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  weightGrams: string;
  attrs: Record<string, string>;
};

const WEIGHT = 'weight';
const toRow = (v: Variant): Row => ({
  label: v.label,
  sku: v.sku,
  price: String(v.price),
  compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : '',
  weightGrams: v.weightGrams ? String(v.weightGrams) : '',
  attrs: { ...v.attributes },
});
const num = (s: string) => (s.trim() === '' ? null : Number(s));
const heading = (f: Field) => (f.unit ? `${f.label} (${f.unit})` : f.label);
const placeholder = (f: Field) => (f.key === 'dimensions' ? '16 × 72' : f.unit ? '—' : '');

/** The category's detail fields, then the shipping weight if the category records it. */
function useColumns(fields: Field[]) {
  return { details: fields.filter((f) => f.key !== WEIGHT), weight: fields.some((f) => f.key === WEIGHT) };
}

function VariantRow({
  productId,
  v,
  fields,
  canWrite,
  canStock,
}: {
  productId: number;
  v: Variant;
  fields: Field[];
  canWrite: boolean;
  canStock: boolean;
}) {
  const { details, weight } = useColumns(fields);
  const [row, setRow] = useState(toRow(v));
  const [pending, start] = useTransition();
  const initial = toRow(v);
  const confirm = useConfirm();
  const attrsDirty = details.some((f) => (row.attrs[f.key] ?? '') !== (initial.attrs[f.key] ?? ''));
  const dirty =
    attrsDirty ||
    (['label', 'sku', 'price', 'compareAtPrice', 'weightGrams'] as const).some((k) => row[k] !== initial[k]);
  const set = (k: Exclude<keyof Row, 'attrs'>) => (e: { target: { value: string } }) =>
    setRow((r) => ({ ...r, [k]: e.target.value }));
  const setAttr = (key: string) => (e: { target: { value: string } }) =>
    setRow((r) => ({ ...r, attrs: { ...r.attrs, [key]: e.target.value } }));

  const save = () =>
    start(async () => {
      const changes: Parameters<typeof updateVariantAction>[2] = {};
      if (row.label !== initial.label) changes.label = row.label.trim();
      if (row.sku !== initial.sku) changes.sku = row.sku.trim();
      if (row.price !== initial.price) changes.price = Number(row.price);
      if (row.compareAtPrice !== initial.compareAtPrice) changes.compareAtPrice = num(row.compareAtPrice);
      if (row.weightGrams !== initial.weightGrams) changes.weightGrams = num(row.weightGrams);
      if (attrsDirty)
        changes.attributes = Object.fromEntries(details.map((f) => [f.key, (row.attrs[f.key] ?? '').trim()]));
      const r = await updateVariantAction(productId, v.id, changes);
      if (r.ok) toast.success(`${row.label} saved`);
      else toast.error(r.error);
    });
  const remove = async () => {
    const ok = await confirm({
      title: `Remove ${v.label} (${v.sku})?`,
      description: 'Orders that include it keep their own copy.',
      action: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    start(async () => {
      const r = await deleteVariantAction(productId, v.id);
      if (!r.ok) toast.error(r.error);
    });
  };

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
      {details.map((f) => (
        <TableCell key={f.key}>
          <Input
            className={cell}
            value={row.attrs[f.key] ?? ''}
            onChange={setAttr(f.key)}
            disabled={!canWrite}
            aria-label={heading(f)}
            placeholder={placeholder(f)}
            maxLength={80}
          />
        </TableCell>
      ))}
      {weight && (
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
      )}
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

/** Options (sizes, dimensions…) with their own SKU, price and stock, plus the category's detail fields. */
export default function VariantsEditor({
  productId,
  variants,
  fields,
  optionLabel,
  canWrite,
  canStock,
}: {
  productId: number;
  variants: Variant[];
  fields: Field[];
  optionLabel: string;
  canWrite: boolean;
  canStock: boolean;
}) {
  const { details, weight } = useColumns(fields);
  const empty = {
    label: '',
    sku: '',
    price: '',
    compareAtPrice: '',
    weightGrams: '',
    openingStock: '',
    attrs: {} as Record<string, string>,
  };
  const [draft, setDraft] = useState(empty);
  const [pending, start] = useTransition();
  const set = (k: Exclude<keyof typeof empty, 'attrs'>) => (e: { target: { value: string } }) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));
  const setAttr = (key: string) => (e: { target: { value: string } }) =>
    setDraft((d) => ({ ...d, attrs: { ...d.attrs, [key]: e.target.value } }));

  const add = () =>
    start(async () => {
      const r = await addVariantAction(productId, {
        label: draft.label.trim(),
        ...(draft.sku.trim() && { sku: draft.sku.trim() }),
        price: Number(draft.price),
        compareAtPrice: num(draft.compareAtPrice),
        weightGrams: num(draft.weightGrams),
        openingStock: Number(draft.openingStock) || 0,
        attributes: Object.fromEntries(details.map((f) => [f.key, (draft.attrs[f.key] ?? '').trim()])),
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
            <TableHead className="min-w-32">{optionLabel}</TableHead>
            <TableHead className="min-w-36">SKU</TableHead>
            <TableHead className="w-28">Price ৳</TableHead>
            <TableHead className="w-28">Old price ৳</TableHead>
            {details.map((f) => (
              <TableHead key={f.key} className="min-w-32">
                {heading(f)}
              </TableHead>
            ))}
            {weight && <TableHead className="w-28">Weight g</TableHead>}
            <TableHead className="text-right">Stock</TableHead>
            {canWrite && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((v) => (
            <VariantRow
              key={`${v.id}-${v.sku}-${v.price}-${v.label}-${JSON.stringify(v.attributes)}`}
              productId={productId}
              v={v}
              fields={fields}
              canWrite={canWrite}
              canStock={canStock}
            />
          ))}
          {canWrite && (
            <TableRow className="bg-muted/40">
              <TableCell>
                <Input
                  className="h-8"
                  placeholder={optionLabel === 'Dimensions' ? 'e.g. Small' : 'e.g. Large'}
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
              {details.map((f) => (
                <TableCell key={f.key}>
                  <Input
                    className="h-8"
                    value={draft.attrs[f.key] ?? ''}
                    onChange={setAttr(f.key)}
                    aria-label={`New ${heading(f)}`}
                    placeholder={placeholder(f)}
                    maxLength={80}
                  />
                </TableCell>
              ))}
              {weight && (
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
              )}
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
