import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = true,
}) {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="card max-w-md w-full p-6 shadow-2xl relative border border-subtle">
        <button
          type="button"
          onClick={onCancel}
          className="btn-icon absolute top-4 right-4 text-muted hover:text-main"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-red-500/10 text-red-500'
                : 'bg-amber-500/10 text-amber-500'
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 id="confirm-modal-title" className="text-lg font-bold">
              {title}
            </h2>
            <p id="confirm-modal-desc" className="text-sm text-muted mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="btn btn-secondary btn-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
              onCancel();
            }}
            className={`btn btn-sm ${isDanger ? 'btn-delete' : 'btn-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
