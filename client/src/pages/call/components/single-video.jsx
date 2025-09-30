import { useEffect } from 'react';
import { MdVideocam, MdVideocamOff, MdMic, MdMicOff, MdOutlineScreenShare } from 'react-icons/md';
import { useVideoCall } from '../video-call-context';

function SingleVideo({ selected, type = 'main' }) {
  const { pc, local_stream, screen_stream } = useVideoCall();
  const { id, myself, user, media } = selected || {};

  useEffect(() => {
    const selectedVideoEl = document.getElementById("selected");
    const stream = pc.current[id]?.[type]?.remoteStream || (type === 'main' ? local_stream : (screen_stream ?? local_stream));
    if(selectedVideoEl && stream) {
      const videoTrack = stream.getVideoTracks()[0];
      selectedVideoEl.srcObject = new MediaStream([videoTrack]);
    }
  }, [selected, local_stream, screen_stream]);

  return (
    <div 
      className="selected-wrapper"
      style={{
        display: (type === 'screen' && !media.screen_sharing) ? 'none' : 'block'
      }}
    >
      <video 
        id="selected"
        autoPlay={true}
        playsInline={true}
        muted={true}
        style={{
          display: (type === 'main' && !media.video) ? 'none' : 'block'
        }}
      />
      {type === 'main' ? (
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

export default SingleVideo;