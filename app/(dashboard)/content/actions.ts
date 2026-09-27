'use server';

import { revalidatePath } from 'next/cache';
import { errorMessage } from '@/lib/api/client';
import type { components } from '@/lib/api/schema';
import { adminApi, adminUpload, requireAdmin } from '@/lib/session';

type S = components['schemas'];
export type Hero = S['HeroContent'];
export type Promo = S['PromoTile'];
export type Section = S['AdminContent']['homepage_sections'][number];
export type Faq = S['FaqItem'];

export type Result = { ok: true; url?: string } | { ok: false; error: string };
const h = { header: {} };
const done = (): Result => {
  revalidatePath('/content');
  return { ok: true };
};
const fail = (e: unknown): Result => ({ ok: false, error: errorMessage(e) });

export async function saveHeroAction(hero: Hero): Promise<Result> {
  await requireAdmin('content:write');
  const { error } = await (await adminApi()).PUT('/api/v1/admin/content/hero', { params: h, body: hero });
  return error ? fail(error) : done();
}

export async function savePromosAction(promos: Promo[]): Promise<Result> {
  await requireAdmin('content:write');
  const { error } = await (await adminApi()).PUT('/api/v1/admin/content/promos', { params: h, body: { promos } });
  return error ? fail(error) : done();
}

export async function saveSectionsAction(sections: Section[]): Promise<Result> {
  await requireAdmin('content:write');
  const { error } = await (await adminApi()).PUT('/api/v1/admin/content/sections', { params: h, body: { sections } });
  return error ? fail(error) : done();
}

export async function saveFaqAction(faq: Faq[]): Promise<Result> {
  await requireAdmin('content:write');
  const { error } = await (await adminApi()).PUT('/api/v1/admin/content/faq', { params: h, body: { faq } });
  return error ? fail(error) : done();
}

export async function resetContentAction(key: 'hero' | 'promos' | 'homepage_sections' | 'faq'): Promise<Result> {
  await requireAdmin('content:write');
  const { error } = await (
    await adminApi()
  ).DELETE('/api/v1/admin/content/{key}', { params: { path: { key }, header: {} } });
  return error ? fail(error) : done();
}

/** Uploads a promo image; it only shows on the store once the tiles are saved. */
export async function uploadContentImageAction(form: FormData): Promise<Result> {
  await requireAdmin('content:write');
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Choose an image.' };
  const { ok, body } = await adminUpload('/api/v1/admin/content/images', form);
  return ok
    ? { ok: true, url: (body as { url: string }).url }
    : { ok: false, error: errorMessage(body, 'Upload failed.') };
}

export async function savePageAction(
  slug: 'about' | 'privacy' | 'terms' | 'refund-policy',
  title: string,
  body: string,
): Promise<Result> {
  await requireAdmin('content:write');
  const { error } = await (
    await adminApi()
  ).PUT('/api/v1/admin/pages/{slug}', { params: { path: { slug }, header: {} }, body: { title, body } });
  if (error) return fail(error);
  revalidatePath('/content');
  revalidatePath(`/content/pages/${slug}`);
  return { ok: true };
}

export type SectionProduct = S['SectionProduct'];

/** Products matching a name, slug or SKU, for adding to a homepage section. */
export async function searchProductsAction(q: string): Promise<SectionProduct[]> {
  await requireAdmin('content:write');
  if (q.trim().length < 2) return [];
  const { data } = await (
    await adminApi()
  ).GET('/api/v1/admin/products', { params: { query: { q: q.trim(), limit: 10 }, header: {} } });
  return (data?.items ?? [])
    .filter((p) => p.status !== 'archived')
    .map((p) => ({ id: p.id, name: p.name, slug: p.slug, image: p.image, status: p.status }));
}

export async function saveSectionProductsAction(
  key: 'bestsellers' | 'new-arrivals',
  productIds: number[],
): Promise<Result> {
  await requireAdmin('content:write');
  const { error } = await (
    await adminApi()
  ).PUT('/api/v1/admin/content/section-products/{key}', {
    params: { path: { key }, header: {} },
    body: { productIds },
  });
  return error ? fail(error) : done();
}
