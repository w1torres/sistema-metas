interface SummaryCardProps {
  label: string;
  value: string | number;
  accentClassName?: string;
}

export default function SummaryCard({ label, value, accentClassName = 'text-ink' }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-secondary">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accentClassName}`}>{value}</p>
    </div>
  );
}
