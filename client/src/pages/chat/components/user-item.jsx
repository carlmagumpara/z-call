import Avatar from 'boring-avatars';

function UserItem({ user, active, unreadCount, onClick }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'true' : undefined}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-13 border px-2.5 py-2.5 text-left transition-colors duration-200 ${
          active ? 'border-on-border bg-on-bg' : 'border-transparent hover:bg-surface-hover'
        }`}
      >
        <span className="relative shrink-0">
          <Avatar name={user.username || user.user_id} size={38} variant="beam" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0e1422] ${
              user.online ? 'bg-success' : 'bg-muted-dark'
            }`}
            title={user.online ? 'Online' : 'Offline'}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{user.username || 'Guest'}</span>
          <span className="block text-11 text-muted">{user.online ? 'Online' : 'Offline'}</span>
        </span>
        {unreadCount > 0 && (
          <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-10 font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </li>
  );
}

export default UserItem;
