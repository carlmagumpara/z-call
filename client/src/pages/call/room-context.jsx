import { createContext, useContext, useState, useEffect } from 'react';
import { socket } from '@/shared/socket';

const Context = createContext();

export const useRoom = () => useContext(Context);

function RoomProvider({ children, roomId }) {
  const [users, setUsers] = useState([]);
  const [joined, setJoined] = useState(false);

  const [video, setVideo] = useState(false);
  const [audio, setAudio] = useState(false);

  const joinRoom = (userId, userName) => {
    socket.emit("join", { 
      room_id: roomId,
      user_id: userId,
      username: userName
    });
  };

  useEffect(() => {

  }, [roomId]);

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
      setUsers(prevState => prevState.filter(item => item.user_id !== data.user_id));
    };

    const handleRoomUsers = data => {
      console.log('handleRoomUsers', data);
      setUsers(data);
    };

    const handleBeforeUnload = () => {
      socket.emit("leave", { 
        room_id,
        user_id,
        username
      });
    };

    socket.on("joining", handleJoinRoom);
    socket.on("leaving", handleLeftRoom);
    socket.on("here", handleRoomUsers);
    socket.on("joined", handleJoined);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      socket.off("joining", handleJoinRoom);
      socket.off("leaving", handleLeftRoom);
      socket.off("here", handleRoomUsers);
      socket.off("joined", handleJoined);
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <Context.Provider
      value={{
        users,
        joinRoom
      }}
    >
      {children}
    </Context.Provider>
  )
}

export default RoomProvider;