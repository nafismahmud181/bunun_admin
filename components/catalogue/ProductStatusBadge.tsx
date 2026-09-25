import { cn } from '@/lib/utils';

const STYLE: Record<string, [string, string]> = {
  draft: ['Draft', 'bg-zinc-200 text-zinc-700'],
  active: ['Live', 'bg-emerald-100 text-emerald-900'],
  archived: ['Archived', 'bg-rose-100 text-rose-900'],
};

export default function ProductStatusBadge({ status }: { status: string }) {
  const [label, cls] = STYLE[status] ?? [status, 'bg-zinc-100'];
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', cls)}>{label}</span>;
}
