import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { socket } from '@/shared/socket';
import { generateName } from '@/shared/names';
import Loading from '@/shared/loading';

const PresenceContext = createContext();

export const usePresence = () => useContext(PresenceContext);

function PresenceProvider({ children }) {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [user_id, setUserId] = useState(localStorage.getItem("user_id"));
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if(!user_id) {
      const _user_id = uuidv4();
      localStorage.setItem("user_id", _user_id);

      setUserId(_user_id);
      return;
    }

    const onConnect = () => {
      socket.emit("user_online", {
        user_id
      });
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onUpdateUsers = (value) => {
      setUsers(value);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('update_users', onUpdateUsers);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('update_users', onUpdateUsers);
    };
  }, [user_id]);

  if(!user_id || !isConnected) {
    return <Loading />;
  }

  return (
    <PresenceContext.Provider
      value={{
        user_id,
        users,
      }}
    >
      {children}
    </PresenceContext.Provider>
  )
}

export default PresenceProvider;