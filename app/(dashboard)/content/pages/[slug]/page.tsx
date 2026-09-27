import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageEditor from '@/components/content/PageEditor';
import { dhakaDateTime } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Edit page' };

const SLUGS = ['about', 'privacy', 'terms', 'refund-policy'] as const;
type Slug = (typeof SLUGS)[number];

export default async function EditStorePage({ params }: PageProps<'/content/pages/[slug]'>) {
  await requireAdmin('content:write');
  const { slug } = await params;
  if (!SLUGS.includes(slug as Slug)) notFound();
  const { data: page } = await (
    await adminApi()
  ).GET('/api/v1/admin/pages/{slug}', { params: { path: { slug: slug as Slug }, header: {} } });
  if (!page) notFound();

  return (
    <div className="space-y-4">
      <Link href="/content" className="text-sm text-muted-foreground hover:underline">
        ← Content
      </Link>
      <div>
        <h1 className="text-xl font-semibold">{page.title}</h1>
        <p className="text-sm text-muted-foreground">
          /{page.slug} · {page.updatedAt ? `last changed ${dhakaDateTime(page.updatedAt)}` : 'not written yet'}. Have
          the final wording checked by someone qualified.
        </p>
      </div>
      <PageEditor key={page.updatedAt ?? 'new'} slug={page.slug} title={page.title} body={page.body} />
    </div>
  );
}
