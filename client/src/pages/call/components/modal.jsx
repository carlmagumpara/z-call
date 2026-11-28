import { useEffect } from 'react';

function Modal({ title, open, onClose, children }) {
  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-440 rounded-18 border border-stroke-strong bg-[#0e1422] p-6 shadow-prejoin-card max-[420px]:p-5"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="m-0 text-lg font-semibold text-ink">{title}</h2>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent text-2xl leading-none text-muted transition-colors hover:text-ink"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {children}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="min-h-10 cursor-pointer rounded-10 border border-stroke bg-surface-strong px-5 text-sm font-medium text-ink transition-colors hover:bg-surface-hover"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
