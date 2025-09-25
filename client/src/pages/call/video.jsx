import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash } from 'react-icons/fa';
import { usePresence } from '@/contexts/presence';

function Video({ index, item, count }) {
  const { username } = usePresence();

  return (
    <div
      className="peer-tile"
    >
      <video
        {...item}
        className="peer-video"
      />
      <div className={`peer-name ${item.media?.video ? 'video-on' : 'video-off'}`}>
        <p className="left-name">{item.myself ? `${username} (You)` : item.user?.username}</p>
        <p className="left-mic">{item.media?.audio ? <FaMicrophone /> : <FaMicrophoneSlash />}</p>
        <p className="left-video">{item.media?.video ? <FaVideo /> : <FaVideoSlash />}</p>
      </div>
    </div>
  )
}

export default Video;