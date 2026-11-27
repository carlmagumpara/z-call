import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { socket } from '@/shared/socket';
import { generateName } from '@/shared/names';
import Loading from '@/shared/loading';

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

  useEffect(() => {
    const onConnect = () => {
      // Re-announce on every (re)connect: a reconnect can land on a different
      // server instance, so presence must be recreated rather than remembered.
      socket.emit('user_online', { user_id, username });
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

  if (!is_connected) {
    return <Loading />;
  }

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
      {children}
    </PresenceContext.Provider>
  );
}

export default PresenceProvider;
