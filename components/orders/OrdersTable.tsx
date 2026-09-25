'use client';

import Link from 'next/link';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PAYMENT_LABEL, dhakaDateTime, taka, type OrderRow } from '@/lib/orders';
import StatusBadge from './StatusBadge';

// Filtering and paging happen on the server (URL parameters), so no table features are needed.
const features = tableFeatures({});
const col = createColumnHelper<typeof features, OrderRow>();
const RIGHT = new Set(['itemCount', 'total']);

const columns = col.columns([
  col.accessor('orderNo', {
    header: 'Order',
    cell: ({ getValue }) => (
      <Link href={`/orders/${getValue()}`} className="font-medium text-primary hover:underline">
        {getValue()}
      </Link>
    ),
  }),
  col.accessor('createdAt', { header: 'Placed', cell: ({ getValue }) => dhakaDateTime(getValue()) }),
  col.display({
    id: 'customer',
    header: 'Customer',
    cell: ({ row }) => (
      <div className="leading-tight">
        <div>{row.original.name}</div>
        <div className="text-xs text-muted-foreground">{row.original.phone}</div>
      </div>
    ),
  }),
  col.display({ id: 'area', header: 'Area', cell: ({ row }) => `${row.original.area}, ${row.original.district}` }),
  col.accessor('itemCount', { header: 'Items' }),
  col.accessor('total', { header: 'Total', cell: ({ getValue }) => taka(getValue()) }),
  col.accessor('status', { header: 'Status', cell: ({ getValue }) => <StatusBadge status={getValue()} /> }),
  col.display({
    id: 'payment',
    header: 'Payment',
    cell: ({ row }) => `${PAYMENT_LABEL[row.original.paymentMethod]} · ${PAYMENT_LABEL[row.original.paymentStatus]}`,
  }),
]);

export default function OrdersTable({ rows }: { rows: OrderRow[] }) {
  const table = useTable({ features, columns, data: rows });
  return (
    <div className="overflow-x-auto rounded-lg border bg-background">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id} className={RIGHT.has(header.column.id) ? 'text-right' : ''}>
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                No orders match.
              </TableCell>
            </TableRow>
          )}
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id} className={RIGHT.has(cell.column.id) ? 'text-right tabular-nums' : ''}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
