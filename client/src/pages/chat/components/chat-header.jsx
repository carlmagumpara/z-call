import Avatar from 'boring-avatars';
import { IoArrowBackOutline } from 'react-icons/io5';
import { useChatLayout } from '@/hooks/use-chat-layout';
import ConnectionStatus from './connection-status';

function ChatHeader({ peer, online, status }) {
  const { showList } = useChatLayout();

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-stroke px-3 py-3">
      <button
        type="button"
        onClick={showList}
        aria-label="Back to conversations"
        title="Back to conversations"
        className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-10 border border-stroke bg-surface-strong text-lg text-ink transition-colors hover:bg-surface-hover md:hidden"
      >
        <IoArrowBackOutline />
      </button>
      <Avatar name={peer?.username || peer?.user_id || 'Guest'} size={36} variant="beam" />
      <div className="min-w-0 flex-1">
        <h2 className="m-0 truncate text-sm font-semibold text-ink">{peer?.username || 'Conversation'}</h2>
        <p className="m-0 mt-0.5 flex items-center gap-1.5 text-11 text-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-success' : 'bg-muted-dark'}`} />
          {online ? 'Online' : 'Offline'}
        </p>
      </div>
      <ConnectionStatus status={status} />
    </header>
  );
}

export default ChatHeader;
