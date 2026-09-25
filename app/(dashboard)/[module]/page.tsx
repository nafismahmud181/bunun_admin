import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MODULES, findModule } from '@/lib/modules';

// Placeholder for every module until it gets its own route folder (a static folder takes precedence).
export const dynamicParams = false;

export function generateStaticParams() {
  return MODULES.filter((m) => m.slug !== '').map((m) => ({ module: m.slug }));
}

export async function generateMetadata({ params }: PageProps<'/[module]'>): Promise<Metadata> {
  const { module } = await params;
  return { title: findModule(module)?.label };
}

export default async function ModulePage({ params }: PageProps<'/[module]'>) {
  const { module } = await params;
  const m = findModule(module);
  if (!m) notFound();
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">{m.label}</h1>
      <p className="text-sm text-zinc-500">{m.summary}</p>
      <p className="text-sm text-zinc-400">Not built yet.</p>
    </div>
  );
}
