import { useEffect, useRef, useState } from 'react';
import { IoSend } from 'react-icons/io5';

function MessageComposer({ onSend, onTyping, disabled, placeholder = 'Write a message…' }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
  }, [value]);

  useEffect(() => () => onTyping(false), [onTyping]);

  const submit = () => {
    const body = value.trim();
    if (!body || disabled) return;
    if (onSend(body)) setValue('');
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="shrink-0 border-t border-stroke p-3">
      <div className="flex items-end gap-2 rounded-13 border border-stroke-strong bg-surface-input p-2 transition-colors focus-within:border-accent-input-border">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="Message"
          onChange={(event) => {
            setValue(event.target.value);
            onTyping(true);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => onTyping(false)}
          className="max-h-[120px] min-h-7 w-full resize-none border-0 bg-transparent px-1.5 py-1 text-sm leading-[1.5] text-ink outline-none placeholder:text-placeholder disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          title="Send message"
          aria-label="Send message"
          className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-10 border-0 bg-cta text-base text-white transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IoSend />
        </button>
      </div>
    </div>
  );
}

export default MessageComposer;
