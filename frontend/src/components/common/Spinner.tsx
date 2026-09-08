interface SpinnerProps {
  label?: string;
}

export default function Spinner({ label = 'Carregando...' }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-secondary">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
