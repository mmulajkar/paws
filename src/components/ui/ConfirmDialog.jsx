import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Delete' }) {
  const confirmRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    confirmRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-[60] p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0" aria-hidden="true">
            <AlertTriangle size={20} className="text-rose-600" />
          </div>
          <h3 id="confirm-title" className="font-serif font-semibold text-stone-900">
            {title}
          </h3>
        </div>
        <p className="text-sm text-stone-600 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button ref={confirmRef} variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
