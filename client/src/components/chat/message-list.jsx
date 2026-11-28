import { useEffect, useRef } from 'react';
import { IoChatbubblesOutline } from 'react-icons/io5';
import MessageBubble from './message-bubble';
import TypingIndicator from './typing-indicator';

function MessageList({ messages, currentUserId, peer, typing }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, typing]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
          <IoChatbubblesOutline className="text-[2.2rem] text-muted-dark" />
          <p className="m-0 text-sm font-semibold text-slate-label">No messages yet</p>
          <p className="m-0 max-w-[280px] text-13 text-muted">
            Say hello to {peer?.username || 'them'} — messages live only in memory and vanish when you leave.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id || `${message.created_at}-${index}`}
              message={message}
              own={message.from === currentUserId}
            />
          ))}
        </div>
      )}
      {typing && <TypingIndicator name={peer?.username} />}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
