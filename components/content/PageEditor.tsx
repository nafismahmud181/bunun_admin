'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { savePageAction } from '@/app/(dashboard)/content/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { renderMarkdown } from '@/lib/markdown';

type Slug = 'about' | 'privacy' | 'terms' | 'refund-policy';

/** Title and text of a store page, with a live preview in the storefront's page style. */
export default function PageEditor({ slug, title, body }: { slug: Slug; title: string; body: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [t, setT] = useState(title);
  const [b, setB] = useState(body);
  const dirty = t !== title || b !== body;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid content-start gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="p-title">Title</Label>
          <Input id="p-title" value={t} onChange={(e) => setT(e.target.value)} maxLength={100} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="p-body">Text</Label>
          <Textarea
            id="p-body"
            value={b}
            onChange={(e) => setB(e.target.value)}
            rows={24}
            className="font-mono text-sm leading-relaxed"
            maxLength={30000}
          />
          <p className="text-xs text-muted-foreground">
            <code>## Heading</code>, a blank line between paragraphs, <code>- </code> for a list, <code>**bold**</code>,{' '}
            <code>[link text](/shop)</code>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={pending || !dirty || t.trim().length < 2}
            onClick={() =>
              start(async () => {
                const r = await savePageAction(slug, t.trim(), b);
                if (!r.ok) return void toast.error(r.error);
                toast.success('Page saved: it is live on the store');
                router.refresh();
              })
            }
          >
            {pending ? 'Saving…' : 'Save page'}
          </Button>
          {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        </div>
      </div>
      <div className="grid content-start gap-2">
        <span className="text-sm font-medium">Preview</span>
        <article className="page-preview rounded-lg border bg-background p-5">
          <h1>{t}</h1>
          {renderMarkdown(b)}
        </article>
      </div>
    </div>
  );
}
