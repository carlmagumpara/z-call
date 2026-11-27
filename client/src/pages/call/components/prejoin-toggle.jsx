function PrejoinToggle({ active, onClick, onIcon, offIcon, onLabel, offLabel }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-10 border text-ink ${
        active
          ? 'border-accent-hover-border bg-on-bg'
          : 'border-off-border bg-off-bg text-danger-soft'
      }`}
      onClick={onClick}
    >
      {active ? onIcon : offIcon}
      {active ? onLabel : offLabel}
    </button>
  );
}

export default PrejoinToggle;
