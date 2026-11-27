import { MdMic, MdMicOff } from 'react-icons/md';

function Video({ id, myself, user, media, onVideoSelect }) {
  const label = myself ? `${user.username} (You)` : user.username;
  const initial = (user.username || '?').trim().charAt(0).toUpperCase();

  const select = () => onVideoSelect(myself ? null : id);

  return (
    <div
      className={`peer-tile ${media.video ? '' : 'peer-tile--off'}`}
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
        className="peer-video"
      />

      {!media.video && (
        <div className="peer-placeholder">
          <span className="peer-placeholder__avatar">{initial}</span>
          <span className="peer-placeholder__text">Camera off</span>
        </div>
      )}

      {!myself && (
        <audio
          id={`remote-audio-${id}`}
          autoPlay={true}
        />
      )}

      <div className="peer-name">
        <span className="peer-name__label">{label}</span>
        <span className={`peer-name__mic ${media.audio ? '' : 'is-muted'}`}>
          {media.audio ? <MdMic /> : <MdMicOff />}
        </span>
      </div>
    </div>
  );
}

export default Video;
