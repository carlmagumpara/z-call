import { useParams } from 'react-router';
import { usePresence } from '@/contexts/presence';
import Call from './call';
import VideoCallProvider from './video-call-context';
import RoomProvider from './room-context';

function Index() {
  const { room_id } = useParams();
  const { user_id, username } = usePresence();

  return (
    <VideoCallProvider>
      <RoomProvider
        roomId={room_id}
        user={{
          user_id, 
          username,
        }}
      >
        <Call />
      </RoomProvider>
    </VideoCallProvider>
  )
}

export default Index;