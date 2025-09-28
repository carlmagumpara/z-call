import { createContext, useContext, useState, useEffect } from 'react';
import { socket } from '@/shared/socket';
import VideoSettings from './components/video-settings';

const Context = createContext();

export const useRoom = () => useContext(Context);

function RoomProvider({ children, roomId, user }) {
  const [users, setUsers] = useState([]);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const handleJoined = () => {
      console.log('handleUserJoin');
      setJoined(true);
    };

    const handleJoinRoom = data => {
      console.log('handleJoinRoom', data);
      setUsers(prevState => ([
        ...prevState,
        data,
      ]));
    };

    const handleLeftRoom = data => {
      console.log('handleLeftRoom', data);
      setUsers(prevState => prevState.filter(item => item.socket_id !== data.socket_id));
    };

    const handleRoomUsers = data => {
      console.log('handleRoomUsers', data);
      setUsers(data);
    };

    const handleBeforeUnload = () => {
      socket.emit("leave", { 
        room_id: roomId,
      });

      setJoined(false);
    };

    const handleVisibilityChange = () => {
      if(document.visibilityState == 'hidden') {
        handleBeforeUnload();
      }
    }

    socket.on("joining", handleJoinRoom);
    socket.on("leaving", handleLeftRoom);
    socket.on("here", handleRoomUsers);
    socket.on("joined", handleJoined);
    window.addEventListener('beforeunload', handleBeforeUnload);
    // window.addEventListener('pagehide', handleBeforeUnload);
    // window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      socket.off("joining", handleJoinRoom);
      socket.off("leaving", handleLeftRoom);
      socket.off("here", handleRoomUsers);
      socket.off("joined", handleJoined);
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // window.removeEventListener('pagehide', handleBeforeUnload);
      // window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [roomId]);

  const joinRoom = (userId, userName) => {
    socket.emit("join", { 
      room_id: roomId,
      user_id: userId,
      username: userName
    });
  };

  return (
    <Context.Provider
      value={{
        users,
        roomId,
        joinRoom
      }}
    >
      {(!joined && !users.length) ? (
        <VideoSettings 
          user={user} 
        />
      ) : children}
    </Context.Provider>
  )
}

export default RoomProvider;