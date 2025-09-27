import { 
  FaVideo, 
  FaVideoSlash, 
  FaMicrophone, 
  FaMicrophoneSlash,
} from 'react-icons/fa';
import { 
  MdOutlineScreenShare, 
  MdOutlineStopScreenShare 
} from 'react-icons/md';

function Video({ myself, user, media, onVideoSelect, ...videoProps }) {
  return (
    <div
      className="peer-tile"
      onClick={() => onVideoSelect()}
    >
      <video
        {...videoProps}
        className="peer-video"
      />
      <div className={`peer-name ${media.video ? 'video-on' : 'video-off'}`}>
        <p className="left-name">{myself ? `${user.username} (You)` : user.username}</p>
        <p className="left-mic">{media.audio ? <FaMicrophone /> : <FaMicrophoneSlash />}</p>
        <p className="left-video">{media.video ? <FaVideo /> : <FaVideoSlash />}</p>
      </div>
    </div>
  )
}

export default Video;