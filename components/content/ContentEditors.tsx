'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  type Faq,
  type Hero,
  type Promo,
  type Section,
  type SectionProduct,
  resetContentAction,
  saveFaqAction,
  saveHeroAction,
  savePromosAction,
  saveSectionProductsAction,
  saveSectionsAction,
  searchProductsAction,
  uploadContentImageAction,
} from '@/app/(dashboard)/content/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/components/ConfirmProvider';
import { fromDhakaInput, toDhakaInput } from '@/lib/dhaka';
import { imgSrc } from '@/lib/images';

type Key = 'hero' | 'promos' | 'homepage_sections' | 'faq';

/** Save + "Use the default" buttons shared by every editor. */
function Actions({
  pending,
  dirty,
  onSave,
  resetKey,
  isDefault,
  run,
}: {
  pending: boolean;
  dirty: boolean;
  onSave: () => void;
  resetKey: Key;
  isDefault: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) => void;
}) {
  const confirm = useConfirm();
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <Button onClick={onSave} disabled={pending || !dirty}>
        {pending ? 'Saving…' : 'Save'}
      </Button>
      {!isDefault && (
        <Button
          variant="ghost"
          disabled={pending}
          onClick={async () =>
            (await confirm({
              title: 'Go back to the original?',
              description: 'This part of the homepage returns to the content the store was built with.',
              action: 'Use the original',
            })) && run(() => resetContentAction(resetKey), 'Back to the original')
          }
        >
          Use the original
        </Button>
      )}
      {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
    </div>
  );
}

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.error);
      toast.success(msg);
      router.refresh();
    });
  return { pending, run };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// ---------- Sale banner ----------

export function HeroForm({ hero, isDefault }: { hero: Hero; isDefault: boolean }) {
  const { pending, run } = useRun();
  const [f, setF] = useState(hero);
  const [ends, setEnds] = useState(toDhakaInput(hero.countdownEnds));
  const value: Hero = { ...f, countdownEnds: fromDhakaInput(ends) };
  const set = (k: 'eyebrow' | 'title' | 'text') => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });
  const past = !!value.countdownEnds && new Date(value.countdownEnds) <= new Date();

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="h-eyebrow">Small line above the headline</Label>
          <Input id="h-eyebrow" value={f.eyebrow} onChange={set('eyebrow')} maxLength={60} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="h-ends">Countdown ends (Bangladesh time)</Label>
          <div className="flex gap-2">
            <Input id="h-ends" type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
            {ends && (
              <Button variant="outline" onClick={() => setEnds('')}>
                No countdown
              </Button>
            )}
          </div>
          {past && <p className="text-xs text-amber-700">This time has passed, so the countdown is hidden.</p>}
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="h-title">Headline</Label>
        <Input id="h-title" value={f.title} onChange={set('title')} maxLength={120} />
        <p className="text-xs text-muted-foreground">
          Put *stars* around words to highlight them, e.g. Up to *25% off* runners.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="h-text">Text</Label>
        <Textarea id="h-text" rows={2} value={f.text} onChange={set('text')} maxLength={300} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="grid gap-2 rounded-md border p-3">
          <legend className="px-1 text-sm font-medium">Main button</legend>
          <Input
            aria-label="Main button label"
            value={f.primary.label}
            onChange={(e) => setF({ ...f, primary: { ...f.primary, label: e.target.value } })}
            maxLength={40}
          />
          <Input
            aria-label="Main button link"
            value={f.primary.href}
            onChange={(e) => setF({ ...f, primary: { ...f.primary, href: e.target.value } })}
            placeholder="/shop"
          />
        </fieldset>
        <fieldset className="grid gap-2 rounded-md border p-3">
          <legend className="px-1 text-sm font-medium">Second button</legend>
          {f.secondary ? (
            <>
              <Input
                aria-label="Second button label"
                value={f.secondary.label}
                onChange={(e) => setF({ ...f, secondary: { ...f.secondary!, label: e.target.value } })}
                maxLength={40}
              />
              <Input
                aria-label="Second button link"
                value={f.secondary.href}
                onChange={(e) => setF({ ...f, secondary: { ...f.secondary!, href: e.target.value } })}
              />
              <Button
                variant="ghost"
                size="sm"
                className="justify-self-start"
                onClick={() => setF({ ...f, secondary: null })}
              >
                Remove this button
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="justify-self-start"
              onClick={() => setF({ ...f, secondary: { label: 'Browse all', href: '/shop' } })}
            >
              Add a second button
            </Button>
          )}
        </fieldset>
      </div>
      <p className="text-xs text-muted-foreground">
        Links: a store path such as /shop, /shop?cat=table-runners or /product/…, or a full https:// address.
      </p>
      <Actions
        pending={pending}
        dirty={!same(value, hero)}
        onSave={() => run(() => saveHeroAction(value), 'Sale banner saved')}
        resetKey="hero"
        isDefault={isDefault}
        run={run}
      />
    </div>
  );
}

// ---------- Promo tiles ----------

const BLANK_PROMO: Promo = {
  tag: '',
  tagStyle: 'gold',
  title: '',
  text: '',
  buttonLabel: 'Shop now',
  href: '/shop',
  imageUrl: '',
};

function move<T>(list: T[], i: number, by: -1 | 1) {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}

export function PromosEditor({ promos, isDefault }: { promos: Promo[]; isDefault: boolean }) {
  const { pending, run } = useRun();
  const [list, setList] = useState(promos);
  const [uploading, setUploading] = useState<number | null>(null);
  const update = (i: number, patch: Partial<Promo>) => setList(list.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const upload = async (i: number, file: File) => {
    setUploading(i);
    const form = new FormData();
    form.append('file', file);
    const r = await uploadContentImageAction(form);
    setUploading(null);
    if (!r.ok) return void toast.error(r.error);
    update(i, { imageUrl: r.url! });
    toast.success('Image uploaded. Save the tiles to show it.');
  };
  const incomplete = list.some((p) => !p.title.trim() || !p.buttonLabel.trim() || !p.href.trim() || !p.imageUrl);

  return (
    <div className="grid gap-4">
      {list.length === 0 && <p className="text-sm text-muted-foreground">No promo tiles: the section is empty.</p>}
      {list.map((p, i) => (
        <div key={i} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[180px_1fr]">
          <div className="grid content-start gap-2">
            <div
              className="aspect-[4/3] w-full rounded-md bg-muted bg-cover bg-center"
              style={p.imageUrl ? { backgroundImage: `url('${imgSrc(p.imageUrl, 400)}')` } : undefined}
              role="img"
              aria-label={`Tile ${i + 1} image`}
            />
            <label className="cursor-pointer text-center text-sm font-medium text-primary hover:underline">
              {uploading === i ? 'Uploading…' : p.imageUrl ? 'Change image' : 'Upload image'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading !== null}
                aria-label={`Upload image for tile ${i + 1}`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void upload(i, file);
                }}
              />
            </label>
          </div>
          <div className="grid gap-2">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                aria-label={`Tile ${i + 1} title`}
                placeholder="Title, e.g. Eid Festive Collection"
                value={p.title}
                onChange={(e) => update(i, { title: e.target.value })}
                maxLength={60}
              />
              <div className="flex gap-2">
                <Input
                  aria-label={`Tile ${i + 1} label`}
                  placeholder="Label, e.g. Up to 25% Off"
                  value={p.tag}
                  onChange={(e) => update(i, { tag: e.target.value })}
                  maxLength={30}
                  className="w-44"
                />
                <select
                  aria-label={`Tile ${i + 1} label colour`}
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={p.tagStyle}
                  onChange={(e) => update(i, { tagStyle: e.target.value as Promo['tagStyle'] })}
                >
                  <option value="gold">Gold</option>
                  <option value="red">Red</option>
                </select>
              </div>
            </div>
            <Textarea
              aria-label={`Tile ${i + 1} text`}
              placeholder="One line about the offer"
              rows={2}
              value={p.text}
              onChange={(e) => update(i, { text: e.target.value })}
              maxLength={160}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                aria-label={`Tile ${i + 1} button label`}
                value={p.buttonLabel}
                onChange={(e) => update(i, { buttonLabel: e.target.value })}
                maxLength={30}
              />
              <Input
                aria-label={`Tile ${i + 1} button link`}
                value={p.href}
                onChange={(e) => update(i, { href: e.target.value })}
                placeholder="/shop?cat=cushion-covers"
              />
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => setList(move(list, i, -1))}>
                Move up
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={i === list.length - 1}
                onClick={() => setList(move(list, i, 1))}
              >
                Move down
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => setList(list.filter((_, j) => j !== i))}
              >
                Remove tile
              </Button>
            </div>
          </div>
        </div>
      ))}
      {list.length < 4 && (
        <Button variant="outline" className="justify-self-start" onClick={() => setList([...list, BLANK_PROMO])}>
          Add a tile
        </Button>
      )}
      {incomplete && (
        <p className="text-xs text-amber-700">Every tile needs a title, an image, a button label and a link.</p>
      )}
      <Actions
        pending={pending || uploading !== null}
        dirty={!same(list, promos) && !incomplete}
        onSave={() => run(() => savePromosAction(list), 'Promo tiles saved')}
        resetKey="promos"
        isDefault={isDefault}
        run={run}
      />
    </div>
  );
}

// ---------- Homepage sections ----------

const SECTION_LABEL: Record<Section['key'], string> = {
  hero: 'Sale banner and countdown',
  trust: 'Trust badges (COD, nationwide delivery…)',
  categories: 'Shop by category',
  bestsellers: 'Best sellers',
  promos: 'Promo tiles',
  'new-arrivals': 'New arrivals',
  budget: 'Shop by budget',
  story: 'Our artisans story',
  reviews: 'Customer reviews',
  faq: 'Frequently asked questions',
  newsletter: 'Newsletter sign-up',
};

export function SectionsEditor({ sections, isDefault }: { sections: Section[]; isDefault: boolean }) {
  const { pending, run } = useRun();
  const [list, setList] = useState(sections);
  return (
    <div className="grid gap-2">
      <ol className="divide-y rounded-lg border">
        {list.map((s, i) => (
          <li key={s.key} className="flex items-center gap-3 px-3 py-2">
            <span className="w-5 text-right text-xs tabular-nums text-muted-foreground">{i + 1}</span>
            <label className="flex flex-1 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.visible}
                onChange={(e) => setList(list.map((x) => (x.key === s.key ? { ...x, visible: e.target.checked } : x)))}
              />
              <span className={s.visible ? '' : 'text-muted-foreground line-through'}>{SECTION_LABEL[s.key]}</span>
            </label>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Move ${SECTION_LABEL[s.key]} up`}
              disabled={i === 0}
              onClick={() => setList(move(list, i, -1))}
            >
              ↑
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Move ${SECTION_LABEL[s.key]} down`}
              disabled={i === list.length - 1}
              onClick={() => setList(move(list, i, 1))}
            >
              ↓
            </Button>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">
        Untick a section to hide it. Choose the products for Best sellers and New arrivals below.
      </p>
      <Actions
        pending={pending}
        dirty={!same(list, sections)}
        onSave={() => run(() => saveSectionsAction(list), 'Homepage order saved')}
        resetKey="homepage_sections"
        isDefault={isDefault}
        run={run}
      />
    </div>
  );
}

// ---------- FAQ ----------

export function FaqEditor({ faq, isDefault, tokens }: { faq: Faq[]; isDefault: boolean; tokens: string[] }) {
  const { pending, run } = useRun();
  const [list, setList] = useState(faq);
  const update = (i: number, patch: Partial<Faq>) => setList(list.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const incomplete = list.some((f) => f.q.trim().length < 3 || !f.a.trim());
  return (
    <div className="grid gap-3">
      {list.map((f, i) => (
        <div key={i} className="grid gap-2 rounded-lg border p-3">
          <Input
            aria-label={`Question ${i + 1}`}
            placeholder="Question"
            value={f.q}
            onChange={(e) => update(i, { q: e.target.value })}
            maxLength={200}
          />
          <Textarea
            aria-label={`Answer ${i + 1}`}
            placeholder="Answer"
            rows={2}
            value={f.a}
            onChange={(e) => update(i, { a: e.target.value })}
            maxLength={1000}
          />
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => setList(move(list, i, -1))}>
              Move up
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={i === list.length - 1}
              onClick={() => setList(move(list, i, 1))}
            >
              Move down
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => setList(list.filter((_, j) => j !== i))}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      {list.length < 30 && (
        <Button variant="outline" className="justify-self-start" onClick={() => setList([...list, { q: '', a: '' }])}>
          Add a question
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        These fill in from Settings, so answers stay right when fees change:{' '}
        {tokens.map((t, i) => (
          <span key={t}>
            {i > 0 && ', '}
            <code className="rounded bg-muted px-1">{t}</code>
          </span>
        ))}
        .
      </p>
      {incomplete && <p className="text-xs text-amber-700">Every question needs an answer.</p>}
      <Actions
        pending={pending}
        dirty={!same(list, faq) && !incomplete}
        onSave={() => run(() => saveFaqAction(list), 'FAQ saved')}
        resetKey="faq"
        isDefault={isDefault}
        run={run}
      />
    </div>
  );
}

// ---------- Products in a homepage section ----------

export function SectionProductsEditor({
  sectionKey,
  products,
}: {
  sectionKey: 'bestsellers' | 'new-arrivals';
  products: SectionProduct[];
}) {
  const { pending, run } = useRun();
  const [list, setList] = useState(products);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SectionProduct[]>([]);
  const [searching, startSearch] = useTransition();
  const search = (value: string) => {
    setQ(value);
    if (value.trim().length < 2) return setResults([]);
    startSearch(async () => setResults(await searchProductsAction(value)));
  };
  const add = (p: SectionProduct) => {
    if (!list.some((x) => x.id === p.id)) setList([...list, p]);
    setQ('');
    setResults([]);
  };

  return (
    <div className="grid gap-2">
      {list.length === 0 && (
        <p className="text-sm text-muted-foreground">None picked: the store fills this section automatically.</p>
      )}
      <ol className="divide-y rounded-lg border">
        {list.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3 px-3 py-2">
            <span className="w-5 text-right text-xs tabular-nums text-muted-foreground">{i + 1}</span>
            <div
              className="size-10 shrink-0 rounded bg-muted bg-cover bg-center"
              style={p.image ? { backgroundImage: `url('${imgSrc(p.image, 400)}')` } : undefined}
            />
            <span className="flex-1 text-sm">
              {p.name}
              {p.status !== 'active' && (
                <span className="ml-2 rounded bg-amber-50 px-1.5 text-xs text-amber-800">
                  {p.status}: not shown until published
                </span>
              )}
            </span>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Move ${p.name} up`}
              disabled={i === 0}
              onClick={() => setList(move(list, i, -1))}
            >
              ↑
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Move ${p.name} down`}
              disabled={i === list.length - 1}
              onClick={() => setList(move(list, i, 1))}
            >
              ↓
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => setList(list.filter((x) => x.id !== p.id))}
            >
              Remove
            </Button>
          </li>
        ))}
      </ol>
      {list.length < 12 && (
        <div className="relative">
          <Input
            placeholder="Add a product: search by name or SKU…"
            aria-label={`Add a product to ${sectionKey}`}
            value={q}
            onChange={(e) => search(e.target.value)}
          />
          {(results.length > 0 || (searching && q.length >= 2)) && (
            <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-background shadow-md">
              {searching && results.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>
              )}
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                    disabled={list.some((x) => x.id === p.id)}
                    onClick={() => add(p)}
                  >
                    <span>{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {list.some((x) => x.id === p.id) ? 'already added' : p.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 pt-2">
        <Button
          disabled={pending || same(list, products)}
          onClick={() =>
            run(
              () =>
                saveSectionProductsAction(
                  sectionKey,
                  list.map((p) => p.id),
                ),
              'Section products saved',
            )
          }
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
        {!same(list, products) && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
    </div>
  );
}
