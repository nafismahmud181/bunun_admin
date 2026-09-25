import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findModule } from '@/lib/modules';
import { requireAdmin } from '@/lib/session';

// Placeholder for every module until it gets its own route folder (a static folder takes precedence).

export async function generateMetadata({ params }: PageProps<'/[module]'>): Promise<Metadata> {
  const { module } = await params;
  return { title: findModule(module)?.label };
}

export default async function ModulePage({ params }: PageProps<'/[module]'>) {
  const { module } = await params;
  const m = findModule(module);
  if (!m || m.built) notFound();
  await requireAdmin(m.permission);
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">{m.label}</h1>
      <p className="text-sm text-muted-foreground">{m.summary}</p>
      <p className="text-sm text-muted-foreground">Not built yet.</p>
    </div>
  );
}
