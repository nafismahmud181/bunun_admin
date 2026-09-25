'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateProductAction, type ProductUpdate } from '@/app/(dashboard)/products/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { components } from '@/lib/api/schema';

type Product = components['schemas']['AdminProduct'];
type Fields = Required<Omit<ProductUpdate, 'status'>>;
const TEXT_FIELDS = [
  'nameEn',
  'nameBn',
  'slug',
  'tag',
  'descriptionEn',
  'descriptionBn',
  'seoTitle',
  'seoDescription',
] as const;

export default function ProductDetailsForm({
  product,
  categories,
  canWrite,
}: {
  product: Product;
  categories: { id: number; name: string }[];
  canWrite: boolean;
}) {
  const initial: Fields = {
    nameEn: product.nameEn,
    nameBn: product.nameBn ?? '',
    slug: product.slug,
    categoryId: product.categoryId,
    tag: product.tag ?? '',
    descriptionEn: product.descriptionEn ?? '',
    descriptionBn: product.descriptionBn ?? '',
    seoTitle: product.seoTitle ?? '',
    seoDescription: product.seoDescription ?? '',
  };
  const [form, setForm] = useState<Fields>(initial);
  const [pending, start] = useTransition();
  const set = (k: keyof Fields) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: k === 'categoryId' ? Number(e.target.value) : e.target.value }));

  // Only what changed. Empty optional fields become null (cleared); name and slug can't be emptied.
  const diff: Record<string, string | number | null> = {};
  for (const k of TEXT_FIELDS)
    if ((form[k] ?? '') !== (initial[k] ?? '')) diff[k] = String(form[k] ?? '').trim() || null;
  if (form.categoryId !== initial.categoryId) diff.categoryId = form.categoryId;
  if (diff.nameEn === null) delete diff.nameEn;
  if (diff.slug === null) delete diff.slug;
  const changes = diff as ProductUpdate;
  const dirty = Object.keys(changes).length > 0;

  const save = () =>
    start(async () => {
      const r = await updateProductAction(product.id, changes);
      if (r.ok) toast.success('Saved');
      else toast.error(r.error);
    });

  const field = (id: keyof Fields, label: string, hint?: string, props: Record<string, unknown> = {}) => (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={String(form[id] ?? '')} onChange={set(id)} disabled={!canWrite} {...props} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        {field('nameEn', 'Name (English)', undefined, { maxLength: 150 })}
        {field('nameBn', 'Name (বাংলা)', 'Shown when the Bangla storefront arrives.', { maxLength: 150, lang: 'bn' })}
        <div className="grid gap-1.5">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            value={form.categoryId}
            onChange={set('categoryId')}
            disabled={!canWrite}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {field('tag', 'Badge', 'Optional label on the product card, e.g. New, Best Seller, Sale.', { maxLength: 30 })}
        {field('slug', 'Web address', `/product/${form.slug}. Changing it breaks old links.`, { maxLength: 120 })}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="descriptionEn">Description (English)</Label>
        <Textarea
          id="descriptionEn"
          rows={4}
          value={form.descriptionEn ?? ''}
          onChange={set('descriptionEn')}
          disabled={!canWrite}
          maxLength={5000}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="descriptionBn">Description (বাংলা)</Label>
        <Textarea
          id="descriptionBn"
          rows={3}
          lang="bn"
          value={form.descriptionBn ?? ''}
          onChange={set('descriptionBn')}
          disabled={!canWrite}
          maxLength={5000}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {field('seoTitle', 'Search title', 'Up to 70 characters. Empty: the product name.', { maxLength: 70 })}
        {field('seoDescription', 'Search description', 'Up to 170 characters. Empty: the description.', {
          maxLength: 170,
        })}
      </div>
      {canWrite && (
        <div className="flex gap-2">
          <Button onClick={save} disabled={!dirty || pending}>
            {pending ? 'Saving…' : 'Save details'}
          </Button>
          {dirty && (
            <Button variant="ghost" onClick={() => setForm(initial)} disabled={pending}>
              Discard changes
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
