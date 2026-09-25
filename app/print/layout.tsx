import { requireAdmin } from '@/lib/session';

// Printable documents: no sidebar, white page, A4-friendly width.
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin('orders:read');
  return <div className="mx-auto max-w-[210mm] bg-white p-8 text-sm text-black print:p-0">{children}</div>;
}
