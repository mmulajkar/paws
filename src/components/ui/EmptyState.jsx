import { Dog } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ text, actionLabel, onAction, icon: Icon = Dog }) {
  return (
    <div className="text-center py-14 px-4 border border-dashed border-stone-300 rounded-xl bg-white">
      <Icon size={32} className="mx-auto text-stone-300 mb-3" aria-hidden="true" />
      <p className="text-stone-500 text-sm mb-4">{text}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mx-auto">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
