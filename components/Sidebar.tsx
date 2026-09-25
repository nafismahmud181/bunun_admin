'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** Module links, already filtered to what the signed-in admin's role may open. */
export default function Sidebar({ modules }: { modules: { slug: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {modules.map((m) => {
        const href = '/' + m.slug;
        const active = m.slug === '' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={m.label}
            href={href}
            className={cn(
              'rounded-md px-3 py-2 text-sm',
              active ? 'bg-primary font-medium text-primary-foreground' : 'text-foreground/80 hover:bg-muted',
            )}
          >
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}
