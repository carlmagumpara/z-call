import { IoCloseOutline, IoPeopleOutline } from 'react-icons/io5';
import UserItem from './user-item';

function UserList({ users, activePeerId, unread, onSelect, onClose }) {
  const onlineCount = users.filter((user) => user.online).length;

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-stroke px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="m-0 text-sm font-semibold text-ink">Conversations</h2>
          <p className="m-0 mt-0.5 text-11 text-muted">{onlineCount} online</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            title="Close chat"
            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-10 border border-stroke bg-surface-strong text-lg text-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <IoCloseOutline />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
        {users.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <IoPeopleOutline className="text-[2rem] text-muted-dark" />
            <p className="m-0 text-sm font-semibold text-slate-label">No one else online</p>
            <p className="m-0 text-13 text-muted">Share your link and start a conversation.</p>
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {users.map((user) => (
              <UserItem
                key={user.user_id}
                user={user}
                active={user.user_id === activePeerId}
                unreadCount={unread[user.user_id] || 0}
                onClick={() => onSelect(user.user_id)}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default UserList;
