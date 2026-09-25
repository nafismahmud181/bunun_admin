'use client';

import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  updateCategoryAction,
  uploadCategoryImageAction,
} from '@/app/(dashboard)/categories/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { components } from '@/lib/api/schema';
import { imgSrc } from '@/lib/images';

type Category = components['schemas']['AdminCategory'];

function CategoryRow({
  c,
  index,
  count,
  onMove,
  canWrite,
}: {
  c: Category;
  index: number;
  count: number;
  onMove: (index: number, by: -1 | 1) => void;
  canWrite: boolean;
}) {
  const [name, setName] = useState(c.name);
  const [nameBn, setNameBn] = useState(c.nameBn ?? '');
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);
  const dirty = name.trim() !== c.name || nameBn.trim() !== (c.nameBn ?? '');
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success?: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (success) toast.success(success);
      } else toast.error(r.error);
    });

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border bg-background p-3">
      <button
        type="button"
        className="size-14 shrink-0 overflow-hidden rounded bg-muted"
        onClick={() => canWrite && file.current?.click()}
        disabled={!canWrite || pending}
        title={canWrite ? 'Change image' : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {c.imageUrl && <img src={imgSrc(c.imageUrl, 400)} alt="" className="size-full object-cover" />}
      </button>
      <input
        ref={file}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label={`Image for ${c.name}`}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const form = new FormData();
          form.set('file', f);
          run(() => uploadCategoryImageAction(c.id, form), 'Image updated');
        }}
      />
      <div className="grid min-w-48 flex-1 gap-1.5 sm:grid-cols-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canWrite} aria-label="Name" />
        <Input
          value={nameBn}
          onChange={(e) => setNameBn(e.target.value)}
          disabled={!canWrite}
          lang="bn"
          placeholder="বাংলা নাম"
          aria-label="Bangla name"
        />
        <p className="text-xs text-muted-foreground sm:col-span-2">
          /shop?cat={c.slug} · {c.productCount} product{c.productCount === 1 ? '' : 's'}
          {!c.active && ' · hidden from the store'}
        </p>
      </div>
      {canWrite && (
        <div className="flex flex-wrap items-center gap-1">
          {dirty && (
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                run(() => updateCategoryAction(c.id, { name: name.trim(), nameBn: nameBn.trim() || null }), 'Saved')
              }
            >
              Save
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(
                () => updateCategoryAction(c.id, { active: !c.active }),
                c.active ? 'Hidden from the store' : 'Shown on the store',
              )
            }
          >
            {c.active ? 'Hide' : 'Show'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={index === 0 || pending}
            onClick={() => onMove(index, -1)}
            aria-label="Move up"
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={index === count - 1 || pending}
            onClick={() => onMove(index, 1)}
            aria-label="Move down"
          >
            ↓
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending || c.productCount > 0}
            title={c.productCount > 0 ? 'Only empty categories can be deleted' : undefined}
            onClick={() => confirm(`Delete ${c.name}?`) && run(() => deleteCategoryAction(c.id), 'Deleted')}
          >
            Delete
          </Button>
        </div>
      )}
    </li>
  );
}

export default function CategoriesEditor({ categories, canWrite }: { categories: Category[]; canWrite: boolean }) {
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [pending, start] = useTransition();
  const move = (index: number, by: -1 | 1) =>
    start(async () => {
      const ids = categories.map((c) => c.id);
      [ids[index], ids[index + by]] = [ids[index + by]!, ids[index]!];
      const r = await reorderCategoriesAction(ids);
      if (!r.ok) toast.error(r.error);
    });
  const add = () =>
    start(async () => {
      const r = await createCategoryAction(name.trim(), nameBn.trim());
      if (r.ok) {
        toast.success(`${name} added`);
        setName('');
        setNameBn('');
      } else toast.error(r.error);
    });

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {categories.map((c, i) => (
          <CategoryRow
            key={`${c.id}-${c.name}-${c.nameBn}-${c.active}-${c.imageUrl}`}
            c={c}
            index={i}
            count={categories.length}
            onMove={move}
            canWrite={canWrite}
          />
        ))}
      </ul>
      {canWrite && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3">
          <Input
            className="w-56"
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            className="w-48"
            placeholder="বাংলা নাম (optional)"
            lang="bn"
            value={nameBn}
            onChange={(e) => setNameBn(e.target.value)}
          />
          <Button onClick={add} disabled={pending || name.trim().length < 2}>
            Add category
          </Button>
        </div>
      )}
    </div>
  );
}
