import { 
  MdVideocam,
  MdVideocamOff,
  MdMic,
  MdMicOff
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
        <p className="left-name">
          {myself ? `${user.username} (You)` : user.username}
        </p>
        <p className="left-mic">
          {media.audio ? <MdMic /> : <MdMicOff />}
        </p>
        <p className="left-video">
          {media.video ? <MdVideocam /> : <MdVideocamOff />}
        </p>
      </div>
    </div>
  );
}

export default Video;