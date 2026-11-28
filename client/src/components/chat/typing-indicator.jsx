function TypingIndicator({ name }) {
  return (
    <div className="flex items-center gap-2 px-1 py-2 text-11 text-muted" role="status" aria-live="polite">
      <span className="inline-flex items-center gap-1 rounded-full border border-stroke bg-surface-strong px-2.5 py-1.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s] motion-reduce:animate-none" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s] motion-reduce:animate-none" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent motion-reduce:animate-none" />
      </span>
      <span>{name ? `${name} is typing…` : 'Typing…'}</span>
    </div>
  );
}

export default TypingIndicator;
