import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { socket } from '@/shared/socket';
import { usePresence } from '@/contexts/presence';
import Loading from '@/shared/loading';
import Call from './call';

function Room() {
  const { room_id } = useParams();
  const { user_id } = usePresence();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    socket.emit("join", { 
      room_id, 
      user_id 
    });

    const handleJoinRoom = data => {
      console.log('handleJoinRoom', data);
      setUsers(prevState => ([
        ...prevState,
        [data.user_id, data.socket_id]
      ]))
    };

    const handleLeftRoom = data => {
      console.log('handleLeftRoom', data);
      setUsers(prevState => prevState.filter(item => item[0] !== data.user_id));
    };

    const handleRoomUsers = data => {
      console.log('handleRoomUsers', data);
      setUsers(data);
    };

    const handleBeforeUnload = (event) => {
      socket.emit("leave", { 
        room_id,
        user_id,
      });
    };

    socket.on("joining", handleJoinRoom);
    socket.on("leaving", handleLeftRoom);
    socket.on("here", handleRoomUsers);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      socket.off("joining", handleJoinRoom);
      socket.off("leaving", handleLeftRoom);
      socket.off("here", handleRoomUsers);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [room_id, user_id]);

  if(!users.length) {
    return <Loading />;
  }

  return (
    <Call
      users={users}
      video={true}
      audio={true}
    />
  )
}

export default Room;