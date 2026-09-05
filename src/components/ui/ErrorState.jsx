import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ErrorState({ message = 'Unable to load this. Please check your connection and try again.', onRetry }) {
  return (
    <div className="text-center py-14 px-4 border border-rose-200 rounded-xl bg-rose-50" role="alert">
      <AlertTriangle size={28} className="mx-auto text-rose-400 mb-3" aria-hidden="true" />
      <p className="text-rose-700 text-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function InlineBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5 mb-4 text-sm text-rose-700" role="alert">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
