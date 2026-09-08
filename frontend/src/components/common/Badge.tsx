import type { IndicadorStatus } from '../../types';
import { STATUS_META } from '../../utils/constants';

interface BadgeProps {
  status: IndicadorStatus;
}

export default function Badge({ status }: BadgeProps) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}>
      <span aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </span>
  );
}
