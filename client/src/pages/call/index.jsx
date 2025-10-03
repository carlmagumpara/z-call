import './video.scss';
import { useParams } from 'react-router';
import { usePresence } from '@/contexts/presence';
import Call from './call';
import VideoCallProvider from './video-call-context';
import RoomProvider from './room-context';
import ChatProvider from './chat-context';

function Index() {
  const { room_id } = useParams();
  const { user_id, username } = usePresence();

  return (
    <div className="vc-root">
      <VideoCallProvider>
        <RoomProvider
          roomId={room_id}
          user={{
            user_id, 
            username,
          }}
        >
          <ChatProvider
            roomId={room_id}
            user={{
              user_id, 
              username,
            }}
          >
            <Call />
          </ChatProvider>
        </RoomProvider>
      </VideoCallProvider>
    </div>
  )
}

export default Index;