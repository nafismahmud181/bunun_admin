'use client';

import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  deleteImageAction,
  reorderImagesAction,
  updateImageAction,
  uploadImageAction,
} from '@/app/(dashboard)/products/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { components } from '@/lib/api/schema';
import { imgSrc } from '@/lib/images';

type Image = components['schemas']['AdminImage'];

/** Product photos: upload (several at once), reorder (first is the main photo), alt text, remove. */
export default function ImageManager({
  productId,
  images,
  canWrite,
}: {
  productId: number;
  images: Image[];
  canWrite: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files];
    start(async () => {
      let done = 0;
      for (const file of list) {
        setProgress(`Uploading ${done + 1} of ${list.length}…`);
        const form = new FormData();
        form.set('file', file);
        const r = await uploadImageAction(productId, form);
        if (!r.ok) toast.error(`${file.name}: ${r.error}`);
        else done++;
      }
      setProgress(null);
      if (done) toast.success(`${done} photo${done === 1 ? '' : 's'} added`);
      if (input.current) input.current.value = '';
    });
  };
  const move = (index: number, by: -1 | 1) =>
    start(async () => {
      const ids = images.map((i) => i.id);
      [ids[index], ids[index + by]] = [ids[index + by]!, ids[index]!];
      const r = await reorderImagesAction(productId, ids);
      if (!r.ok) toast.error(r.error);
    });
  const remove = (img: Image) =>
    start(async () => {
      if (!confirm('Remove this photo?')) return;
      const r = await deleteImageAction(productId, img.id);
      if (!r.ok) toast.error(r.error);
    });
  const saveAlt = (img: Image, alt: string) => {
    if (alt === (img.alt ?? '')) return;
    start(async () => {
      const r = await updateImageAction(productId, img.id, alt);
      if (!r.ok) toast.error(r.error);
    });
  };

  return (
    <div className="space-y-3">
      {images.length === 0 && <p className="text-sm text-muted-foreground">No photos yet.</p>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <li key={img.id} className="space-y-1.5 rounded-lg border bg-background p-2">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc(img.url, 400)}
                alt={img.alt ?? ''}
                className="aspect-square w-full rounded object-cover"
              />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 text-xs text-white">Main</span>
              )}
            </div>
            {canWrite ? (
              <>
                <Input
                  className="h-8 text-xs"
                  placeholder="Describe the photo (alt text)"
                  defaultValue={img.alt ?? ''}
                  onBlur={(e) => saveAlt(img, e.target.value.trim())}
                  maxLength={150}
                  aria-label="Alt text"
                />
                <div className="flex justify-between">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={i === 0 || pending}
                      onClick={() => move(i, -1)}
                      aria-label="Move earlier"
                    >
                      ←
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={i === images.length - 1 || pending}
                      onClick={() => move(i, 1)}
                      aria-label="Move later"
                    >
                      →
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => remove(img)}
                    aria-label="Remove photo"
                  >
                    Remove
                  </Button>
                </div>
              </>
            ) : (
              img.alt && <p className="text-xs text-muted-foreground">{img.alt}</p>
            )}
          </li>
        ))}
      </ul>
      {canWrite && (
        <div className="flex items-center gap-3">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
            aria-label="Upload photos"
          />
          <Button variant="outline" onClick={() => input.current?.click()} disabled={pending}>
            Upload photos
          </Button>
          <span className="text-xs text-muted-foreground">
            {progress ?? 'JPEG, PNG or WebP, at least 300 × 300, up to 10 MB. Square photos look best.'}
          </span>
        </div>
      )}
    </div>
  );
}
