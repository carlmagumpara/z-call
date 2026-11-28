import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { socket } from '@/shared/socket';
import { generateName } from '@/shared/names';

const PresenceContext = createContext();

export const usePresence = () => useContext(PresenceContext);

function ensureIdentity() {
  let user_id = localStorage.getItem('user_id');
  let username = localStorage.getItem('username');

  if (!user_id || !username) {
    user_id = uuidv4();
    username = `${generateName()}_${Math.floor(Math.random() * 1000)}`.replace(/ /g, '_');
    localStorage.setItem('user_id', user_id);
    localStorage.setItem('username', username);
  }

  return { user_id, username };
}

function PresenceProvider({ children }) {
  const [identity, setIdentity] = useState(ensureIdentity);
  const { user_id, username } = identity;
  const [is_connected, setIsConnected] = useState(socket.connected);
  const [users, setUsers] = useState([]);
  // Keep the UI mounted while the socket reconnects: chat messages stay in
  // memory and call controls don't disappear mid-reconnection.
  const hasConnectedRef = useRef(socket.connected);

  useEffect(() => {
    const onConnect = () => {
      // Re-announce on every (re)connect: a reconnect can land on a different
      // server instance, so presence must be recreated rather than remembered.
      socket.emit('user_online', { user_id, username });
      hasConnectedRef.current = true;
      setIsConnected(true);
    };

    const onDisconnect = () => setIsConnected(false);
    const onUpdateUsers = (value) => setUsers(value);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('update_users', onUpdateUsers);

    // The socket may already be connected before React mounts the listeners.
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('update_users', onUpdateUsers);
    };
  }, [user_id, username]);

  return (
    <PresenceContext.Provider
      value={{
        user_id,
        username,
        setUserName: (name) => {
          localStorage.setItem('username', name);
          setIdentity((current) => ({ ...current, username: name }));
        },
        users,
      }}
    >
      {!is_connected && (
        <div
          className="fixed inset-x-0 top-2 z-[60] mx-auto flex w-fit items-center gap-2 rounded-full border border-stroke-strong bg-[#0e1422]/95 px-4 py-2 text-13 text-slate-label shadow-prejoin-card backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-danger motion-reduce:animate-none" />
          {hasConnectedRef.current ? 'Reconnecting…' : 'Connecting…'}
        </div>
      )}
      {children}
    </PresenceContext.Provider>
  );
}

export default PresenceProvider;
