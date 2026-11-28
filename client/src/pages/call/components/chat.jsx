import { useEffect } from 'react';
import { useChat } from '@/hooks/use-chat';
import ChatLayout from '@/pages/chat/components/chat-layout';
import { ChatSidebar, ChatConversation } from '@/pages/chat/components/chat-views';

/** In-call drawer built from the same chat components as the /chat page. */
function ChatPanel({ open, onClose }) {
  const { endConversation } = useChat();

  useEffect(() => {
    if (!open) return undefined;
    return () => endConversation();
  }, [open, endConversation]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex justify-end bg-surface-overlay p-3 backdrop-blur-sm max-[760px]:p-0"
      role="dialog"
      aria-modal="true"
      aria-label="Chat"
    >
      <ChatLayout
        className="h-full w-full max-w-[720px] shadow-prejoin-card"
        sidebar={<ChatSidebar onClose={onClose} />}
      >
        <ChatConversation />
      </ChatLayout>
    </div>
  );
}

export default ChatPanel;
