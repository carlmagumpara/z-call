import { PeerName, PeerPlaceholder } from './peer-pieces';

function SingleVideo({ selected }) {
  const { myself, user, media } = selected || {};

  const label = myself ? `${user?.username || 'You'} (You)` : (user?.username || 'Participant');
  const initial = (user?.username || '?').trim().charAt(0).toUpperCase();

  return (
    <>
      <video
        id="selected"
        className={`block h-full w-full object-cover ${myself ? '-scale-x-100' : ''}`}
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
