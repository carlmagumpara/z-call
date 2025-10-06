import { useRef, useEffect } from 'react';
import { MdVideocam, MdVideocamOff, MdMic, MdMicOff, MdOutlineScreenShare } from 'react-icons/md';
import { useVideoCall } from '../video-call-context';

function Video({ id, myself, user, media, type = 'video' }) {
  const videoRef = useRef(null);
  const { selected, setSelected } = useVideoCall();

  const onVideoClick = () => {
    const videoEl = document.getElementById('selected');
    const newStream = videoRef.current?.srcObject;

    if (!videoEl || !newStream) return;

    if (videoEl.srcObject !== newStream) {
      videoEl.srcObject = newStream;
      videoEl.play().catch(() => {});
    }
    setSelected(id);
  };

  return (
    <div 
      className={`vc-video-container ${(type === 'screen' && !media.screen_sharing ? 'no-diplay' : '')}`}
      onClick={onVideoClick}
    >
      {type === 'video' ? (
        <div className="vc-video-icons">
          <p>
            {media.audio ? <MdMic /> : <MdMicOff />}
          </p>
          <p>
            {media.video ? <MdVideocam /> : <MdVideocamOff />}
          </p>
          {media.screen_sharing ? (
          <p>
            <MdOutlineScreenShare />
          </p>
          ) : null}
        </div>
      ) : null}
      <video
        ref={videoRef}
        id={myself ? `local-${type}` : `remote-${type}-${id}`}
        muted={myself}
        autoPlay={true}
        playsInline={true}
        style={{
          display: (type === 'video' && !media.video) ? 'none' : 'block'
        }}
      ></video>
      {(!myself && type === 'video') ? (
        <audio 
          id={`remote-audio-${id}`}
          autoPlay={true}
        />
      ) : null}
      <div id={`emoji-${id}`} />
      <div className="vc-video-name">
        <p>{`${user.username}${type === 'screen' ? ' (Screen)' : ''}`}</p>
      </div>
    </div>
  )

  return (
    <div
      className="peer-tile"
      onClick={onVideoClick}
      style={{
        display: (type === 'screen' && !media.screen_sharing) ? 'none' : 'block'
      }}
    >
      <video
        ref={videoRef}
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