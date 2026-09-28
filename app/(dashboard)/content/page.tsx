import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FaqEditor,
  HeroForm,
  PromosEditor,
  SectionProductsEditor,
  SectionsEditor,
} from '@/components/content/ContentEditors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/api/client';
import { dhakaDateTime } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Content' };

const STORE = process.env.STOREFRONT_URL || 'http://localhost:3000';

export default async function ContentPage() {
  await requireAdmin('content:write');
  const api = await adminApi();
  const [content, sectionProducts, pages] = await Promise.all([
    api.GET('/api/v1/admin/content', { params: { header: {} } }),
    api.GET('/api/v1/admin/content/section-products', { params: { header: {} } }),
    api.GET('/api/v1/admin/pages', { params: { header: {} } }),
  ]);
  const c = content.data;
  const sp = sectionProducts.data;
  if (!c || !sp || !pages.data)
    return (
      <p className="text-sm text-destructive">
        {errorMessage(content.error ?? sectionProducts.error ?? pages.error, 'Could not load content.')}
      </p>
    );
  const saved = (key: string) => c.updatedAt[key];
  const changed = (key: string) =>
    saved(key) ? `Last changed ${dhakaDateTime(saved(key)!)}` : 'Showing the original content';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Content</h1>
          <p className="text-sm text-muted-foreground">
            What shoppers see on the homepage and store pages. Changes go live when you save.
          </p>
        </div>
        <a href={STORE} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
          Open the store ↗
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Sale banner and countdown</CardTitle>
          <CardDescription>{changed('hero')}</CardDescription>
        </CardHeader>
        <CardContent>
          <HeroForm key={saved('hero') ?? 'default'} hero={c.hero} isDefault={!saved('hero')} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Promo tiles</CardTitle>
          <CardDescription>Up to 4 image tiles with a button. {changed('promos')}</CardDescription>
        </CardHeader>
        <CardContent>
          <PromosEditor key={saved('promos') ?? 'default'} promos={c.promos} isDefault={!saved('promos')} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Homepage sections</CardTitle>
            <CardDescription>Order and show or hide. {changed('homepage_sections')}</CardDescription>
          </CardHeader>
          <CardContent>
            <SectionsEditor
              key={saved('homepage_sections') ?? 'default'}
              sections={c.homepage_sections}
              isDefault={!saved('homepage_sections')}
            />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Best sellers</CardTitle>
              <CardDescription>
                Up to 12 products, in this order. With none picked, the store shows the best-selling products of the
                last 90 days, topped up in featured order while there are few sales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SectionProductsEditor
                key={sp.bestsellers.map((p) => p.id).join(',')}
                sectionKey="bestsellers"
                products={sp.bestsellers}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">New arrivals</CardTitle>
              <CardDescription>
                Up to 12 products, in this order. With none picked, the store shows the 8 newest products.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SectionProductsEditor
                key={sp['new-arrivals'].map((p) => p.id).join(',')}
                sectionKey="new-arrivals"
                products={sp['new-arrivals']}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Frequently asked questions</CardTitle>
          <CardDescription>{changed('faq')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FaqEditor key={saved('faq') ?? 'default'} faq={c.faq} isDefault={!saved('faq')} tokens={c.faqTokens} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Store pages</CardTitle>
          <CardDescription>
            Payment gateways check these during merchant review, so fill in every page before applying.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last changed</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.data.map((p) => (
                <TableRow key={p.slug}>
                  <TableCell>
                    <Link href={`/content/pages/${p.slug}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">/{p.slug}</div>
                  </TableCell>
                  <TableCell>
                    {p.filledIn ? (
                      <span className="text-sm">Written</span>
                    ) : (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800">Headings only</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{p.updatedAt ? dhakaDateTime(p.updatedAt) : '—'}</TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`${STORE}/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      View ↗
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
