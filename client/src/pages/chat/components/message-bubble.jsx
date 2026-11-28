const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function MessageBubble({ message, own }) {
  return (
    <div className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[min(80%,420px)]">
        <div className={`whitespace-pre-wrap break-words rounded-18 px-3.5 py-2 text-sm leading-[1.5] ${
          own
            ? 'rounded-br-[5px] bg-cta text-white'
            : 'rounded-bl-[5px] border border-stroke bg-surface-strong text-ink'
        }`}>
          {message.text}
        </div>
        <span className={`mt-1 block text-10 text-muted ${own ? 'text-right' : ''}`}>
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}

export default MessageBubble;
