import { useEffect } from 'react';
import { useChat } from '@/hooks/use-chat';
import ChatLayout from './components/chat-layout';
import ConnectionStatus from './components/connection-status';
import { ChatSidebar, ChatConversation } from './components/chat-views';

function ChatPage() {
  const { status, endConversation } = useChat();

  // Leaving the chat view ends the in-memory session and drops its messages.
  useEffect(() => () => endConversation(), [endConversation]);

  return (
    <main className="flex h-dvh flex-col gap-3 bg-call-bg px-3 pb-3 pt-[92px] font-sans text-ink max-[760px]:gap-2 max-[760px]:px-2 max-[760px]:pb-2 max-[760px]:pt-[76px]">
      <div className="flex shrink-0 items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <h1 className="m-0 text-lg font-semibold">Messages</h1>
          <p className="m-0 mt-0.5 text-13 text-muted">Private, in-memory chats — nothing is stored.</p>
        </div>
        <ConnectionStatus status={status} />
      </div>

      <ChatLayout className="min-h-0 flex-1" sidebar={<ChatSidebar />}>
        <ChatConversation />
      </ChatLayout>
    </main>
  );
}

export default ChatPage;
