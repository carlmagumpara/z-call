import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { socket } from '@/shared/socket';
import VideoSettings from './components/video-settings';
import { useVideoCall } from './video-call-context';

const Context = createContext();

export const useRoom = () => useContext(Context);

function RoomProvider({ children, roomId, user }) {
  const { setMediaStatus } = useVideoCall();
  const [users, setUsers] = useState([]);
  const [joined, setJoined] = useState(false);
  const joinedRef = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    const handleJoined = () => {
      console.log('handleUserJoin');
      joinedRef.current = true;
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

    // The server sends the latest mic/camera state of everyone already in the
    // room when we join — live events alone would leave them looking muted.
    const handleMediaStatuses = statuses => {
      console.log('handleMediaStatuses', statuses);
      setMediaStatus(previous => ({ ...previous, ...statuses }));
    };

    // Listen here as well as in Call so status changes that arrive before the
    // call screen mounts are not lost.
    const handlePeerMediaStatus = ({ socket_id, data }) => {
      setMediaStatus(previous => ({ ...previous, [socket_id]: data }));
    };

    const handleBeforeUnload = () => {
      socket.emit("leave", { 
        room_id: roomId,
      });

      joinedRef.current = false;
      setJoined(false);
    };

    // A reconnect may land on a different server instance, so rejoin the room.
    const onConnect = () => {
      if (joinedRef.current) {
        socket.emit('join', {
          room_id: roomId,
          user_id: userRef.current?.user_id,
          username: userRef.current?.username,
        });
      }
    };

    socket.on("joining", handleJoinRoom);
    socket.on("leaving", handleLeftRoom);
    socket.on("here", handleRoomUsers);
    socket.on("media-statuses", handleMediaStatuses);
    socket.on("media-status", handlePeerMediaStatus);
    socket.on("joined", handleJoined);
    socket.on('connect', onConnect);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      socket.off("joining", handleJoinRoom);
      socket.off("leaving", handleLeftRoom);
      socket.off("here", handleRoomUsers);
      socket.off("media-statuses", handleMediaStatuses);
      socket.off("media-status", handlePeerMediaStatus);
      socket.off("joined", handleJoined);
      socket.off('connect', onConnect);
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, setMediaStatus]);

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