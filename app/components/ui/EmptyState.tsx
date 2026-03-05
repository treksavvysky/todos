interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{message}</p>
    </div>
  );
}
