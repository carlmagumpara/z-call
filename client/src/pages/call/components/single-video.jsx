import { useEffect } from 'react';
import { MdVideocam, MdVideocamOff, MdMic, MdMicOff } from 'react-icons/md';
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
    <>
      <video 
        id="selected"
        autoPlay={true}
        playsInline={true}
        muted={true}
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
    </>
  );
}

export default SingleVideo;