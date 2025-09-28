import { MdVideocam, MdVideocamOff, MdMic, MdMicOff } from 'react-icons/md';

function Video({ id, myself, user, media, onVideoSelect }) {
  return (
    <div
      className="peer-tile"
      onClick={() => onVideoSelect(myself ? null : id)}
    >
      <video
        id={myself ? 'local' : `remote-video-${id}`}
        muted={myself}
        autoPlay={true}
        playsInline={true}
        className="peer-video"
      />
      {!myself ? (
        <audio 
          id={`remote-audio-${id}`}
          autoPlay={true}
        />
      ) : null}
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