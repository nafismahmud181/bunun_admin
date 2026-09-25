import { STATUS_CLASS, STATUS_LABEL, type OrderStatus } from '@/lib/orders';
import { cn } from '@/lib/utils';

export default function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS_CLASS[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  );
}
