import { useEffect } from 'react';
import { MdMic, MdMicOff } from 'react-icons/md';
import { useVideoCall } from '../video-call-context';

function SingleVideo({ selected }) {
  const { pc, local_stream } = useVideoCall();
  const { id, myself, user, media } = selected || {};

  useEffect(() => {
    const selectedVideoEl = document.getElementById("selected");
    const stream = pc.current[id]?.remoteStream || local_stream;
    const track = stream?.getVideoTracks?.()[0];
    if (selectedVideoEl && track) {
      selectedVideoEl.srcObject = new MediaStream([track]);
    }
  }, [id, selected, local_stream]);

  const label = myself ? `${user?.username || 'You'} (You)` : (user?.username || 'Participant');
  const initial = (user?.username || '?').trim().charAt(0).toUpperCase();

  return (
    <>
      <video
        id="selected"
        className="peer-video"
        autoPlay={true}
        playsInline={true}
        muted={true}
      />
      {!media?.video && (
        <div className="peer-placeholder">
          <span className="peer-placeholder__avatar peer-placeholder__avatar--large">{initial}</span>
          <span className="peer-placeholder__text">Camera off</span>
        </div>
      )}
      <div className="peer-name peer-name--large">
        <span className="peer-name__label">{label}</span>
        <span className={`peer-name__mic ${media?.audio ? '' : 'is-muted'}`}>
          {media?.audio ? <MdMic /> : <MdMicOff />}
        </span>
      </div>
    </>
  );
}

export default SingleVideo;
