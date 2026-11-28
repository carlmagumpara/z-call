import { PeerName, PeerPlaceholder } from './peer-pieces';

function Video({ id, myself, user, media, onVideoSelect }) {
  const label = myself ? `${user.username} (You)` : user.username;
  const initial = (user.username || '?').trim().charAt(0).toUpperCase();

  const select = () => onVideoSelect(myself ? null : id);

  return (
    <div
      className="relative aspect-video cursor-pointer overflow-hidden rounded-2xl border border-stroke bg-tile transition-[border-color,transform] duration-200 ease-in-out hover:border-accent-tile-border focus-visible:border-accent-tile-border focus-visible:shadow-tile-focus focus-visible:outline-none motion-reduce:transition-none"
      onClick={select}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Focus on ${label}`}
    >
      <video
        id={myself ? 'local' : `remote-video-${id}`}
        muted={myself}
        autoPlay={true}
        playsInline={true}
        className={`block h-full w-full object-cover ${myself ? '-scale-x-100' : ''} ${media.video ? '' : 'opacity-0'}`}
      />

      {!media.video && <PeerPlaceholder initial={initial} />}

      {!myself && (
        <audio
          id={`remote-audio-${id}`}
          autoPlay={true}
        />
      )}

      <PeerName label={label} audio={media.audio} />
    </div>
  );
}

export default Video;
