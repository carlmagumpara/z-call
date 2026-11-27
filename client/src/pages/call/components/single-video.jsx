import { useEffect } from 'react';
import { useVideoCall } from '../video-call-context';
import { PeerName, PeerPlaceholder } from './peer-pieces';

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
        className="block h-full w-full object-cover"
        autoPlay={true}
        playsInline={true}
        muted={true}
      />
      {!media?.video && <PeerPlaceholder initial={initial} large />}
      <PeerName label={label} audio={media?.audio} large />
    </>
  );
}

export default SingleVideo;
