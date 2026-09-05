import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, wide }) {
  const closeButtonRef = useRef(null);
  const triggerRef = useRef(document.activeElement);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    closeButtonRef.current?.focus();
    const trigger = triggerRef.current;
    return () => {
      window.removeEventListener('keydown', onKey);
      // Return focus to whatever opened the modal, for keyboard/screen-reader users.
      if (trigger && typeof trigger.focus === 'function') trigger.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-stone-900/40 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`bg-white w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} sm:rounded-2xl shadow-xl min-h-full sm:min-h-0 sm:my-8`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 sticky top-0 bg-white sm:rounded-t-2xl z-10">
          <h2 id="modal-title" className="text-lg font-serif font-semibold text-stone-900">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-full hover:bg-stone-100 text-stone-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
