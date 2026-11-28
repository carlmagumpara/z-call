import { IoChatbubbleOutline } from 'react-icons/io5';
import { useChat } from '@/hooks/use-chat';
import { usePresence } from '@/contexts/presence';
import { useChatLayout } from '@/hooks/use-chat-layout';
import UserList from './user-list';
import ChatHeader from './chat-header';
import MessageList from './message-list';
import MessageComposer from './message-composer';

/** Conversation views used by the in-call chat drawer. */
export function ChatSidebar({ onClose }) {
  const { users, activePeerId, unread, selectPeer } = useChat();
  const { showConversation } = useChatLayout();

  return (
    <UserList
      users={users}
      activePeerId={activePeerId}
      unread={unread}
      onClose={onClose}
      onSelect={(peerId) => {
        selectPeer(peerId);
        showConversation();
      }}
    />
  );
}

export function ChatConversation() {
  const { user_id } = usePresence();
  const {
    activePeerId,
    activePeer,
    messages,
    typingPeers,
    status,
    isConnected,
    sendMessage,
    notifyTyping,
  } = useChat();

  if (!activePeerId) return <EmptyConversation />;

  return (
    <>
      <ChatHeader peer={activePeer} online={Boolean(activePeer?.online)} status={status} />
      <MessageList
        messages={messages[activePeerId] || []}
        currentUserId={user_id}
        peer={activePeer}
        typing={Boolean(typingPeers[activePeerId])}
      />
      <MessageComposer
        onSend={sendMessage}
        onTyping={notifyTyping}
        disabled={!isConnected || !activePeer?.online}
        placeholder={activePeer?.online ? 'Write a message…' : 'Recipient is offline'}
      />
    </>
  );
}

export function EmptyConversation() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <IoChatbubbleOutline className="text-[2.6rem] text-muted-dark" />
      <h2 className="m-0 text-base font-semibold text-ink">Select someone to start chatting</h2>
      <p className="m-0 max-w-[300px] text-13 text-muted">
        Messages are delivered live and kept only in memory — a refresh clears everything.
      </p>
    </div>
  );
}
