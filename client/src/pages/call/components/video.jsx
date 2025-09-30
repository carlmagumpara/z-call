import { MdVideocam, MdVideocamOff, MdMic, MdMicOff, MdOutlineScreenShare } from 'react-icons/md';

function Video({ id, myself, user, media, onVideoSelect, type = 'video' }) {

  return (
    <div
      className="peer-tile"
      onClick={() => onVideoSelect([myself ? null : id, type === 'video' ? 'main' : type])}
      style={{
        display: (type === 'screen' && !media.screen_sharing) ? 'none' : 'block'
      }}
    >
      <video
        id={myself ? `local-${type}` : `remote-${type}-${id}`}
        muted={myself}
        autoPlay={true}
        playsInline={true}
        className="peer-video"
        style={{
          display: (type === 'video' && !media.video) ? 'none' : 'block'
        }}
      />
      {(!myself && type === 'video') ? (
        <audio 
          id={`remote-audio-${id}`}
          autoPlay={true}
        />
      ) : null}
      {type === 'video' ? (
        <div className="peer-icons">
          <p className="left-mic">
            {media.audio ? <MdMic /> : <MdMicOff />}
          </p>
          <p className="left-video">
            {media.video ? <MdVideocam /> : <MdVideocamOff />}
          </p>
          {media.screen_sharing ? (
          <p className="left-screenshare">
            <MdOutlineScreenShare />
          </p>
          ) : null}
        </div>
      ) : null}
      <div className={`peer-name ${media.video ? 'video-on' : 'video-off'}`}>
        <p className="left-name">
          {`${user.username}${type === 'screen' ? ' (Screen)' : ''}`}
        </p>
      </div>
    </div>
  );
}

export default Video;