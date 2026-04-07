import { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Modal({ open, onClose, title, children, className }) {
  const titleId = useId();

  // Close on Escape
  useEffect(() => {
    if (!open) return undefined;

    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-xl',
          'max-h-[90vh] flex flex-col',
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
