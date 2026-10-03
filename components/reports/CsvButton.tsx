'use client';

import { Button } from '@/components/ui/button';

type Cell = string | number | null;

/** Downloads a table as CSV (opens in Excel; UTF-8 with BOM so Bangla names survive). */
export default function CsvButton({ filename, header, rows }: { filename: string; header: string[]; rows: Cell[][] }) {
  const download = () => {
    const esc = (v: Cell) => {
      const s = v === null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff) + csv], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Button size="sm" variant="ghost" onClick={download} disabled={rows.length === 0}>
      Download CSV
    </Button>
  );
}
