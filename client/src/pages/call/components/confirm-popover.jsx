import { useEffect, useRef, useState } from 'react';

function ConfirmPopover({
  title,
  description,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  tone = 'primary',
  onConfirm,
  children,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {typeof children === 'function' ? children(() => setOpen(true), open) : children}

      {open && (
        <div
          role="dialog"
          aria-label={title}
          className="absolute bottom-[calc(100%+10px)] left-1/2 z-50 w-60 -translate-x-1/2 rounded-14 border border-stroke-strong bg-[#0e1422] p-3.5 text-left shadow-prejoin-card backdrop-blur-14"
        >
          <p className="m-0 text-sm font-semibold text-ink">{title}</p>
          {description && <p className="mb-0 mt-1.5 text-13 leading-snug text-muted">{description}</p>}
          <div className="mt-3.5 flex justify-end gap-2">
            <button
              type="button"
              className="min-h-9 cursor-pointer rounded-10 border border-stroke bg-surface-strong px-3 text-13 text-ink transition-colors hover:bg-surface-hover"
              onClick={() => setOpen(false)}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`min-h-9 cursor-pointer rounded-10 px-3 text-13 font-semibold text-white transition-[filter,background-color] hover:brightness-110 ${
                tone === 'danger' ? 'bg-end-call hover:bg-end-call-hover' : 'bg-cta'
              }`}
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfirmPopover;
