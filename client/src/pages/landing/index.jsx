import { useNavigate } from 'react-router';
import { createElement, useState } from 'react';
import { IoHeart, IoVideocamOutline, IoLinkOutline, IoSparklesOutline } from 'react-icons/io5';
import { usePresence } from '@/contexts/presence';
import { v4 as uuidv4 } from 'uuid';
import './landing.scss';

const features = [
  {
    icon: IoVideocamOutline,
    title: 'Instant rooms',
    text: 'One click creates a private room. Share the link and everyone is in — no invites, no accounts.',
  },
  {
    icon: IoLinkOutline,
    title: 'Peer to peer',
    text: 'Audio and video travel directly between browsers. Nothing to install, nothing to configure.',
  },
  {
    icon: IoSparklesOutline,
    title: 'Made for calls',
    text: 'Screen sharing, gallery and speaker views, and live participant status — all in one clean view.',
  },
];

function roomIdFrom(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  } catch {
    return trimmed.replace(/^\/r\//, '').replace(/[?#].*$/, '');
  }
}

function Landing() {
  const navigate = useNavigate();
  const { users } = usePresence();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const startCall = () => navigate(`/r/${uuidv4()}`);

  const joinCall = (event) => {
    event.preventDefault();
    const id = roomIdFrom(code);
    if (!id) {
      setError('Paste a room link or enter a room code.');
      return;
    }
    navigate(`/r/${encodeURIComponent(id)}`);
  };

  return (
    <main className="landing">
      <div className="landing__background" aria-hidden="true">
        <span className="landing__orb landing__orb--one" />
        <span className="landing__orb landing__orb--two" />
        <span className="landing__grid" />
      </div>

      <section className="landing__hero">
        <div className="landing__status">
          <span className="landing__pulse" />
          {users.length} {users.length === 1 ? 'person' : 'people'} online now
        </div>

        <h1 className="landing__title">
          Good calls,
          <br />
          <span>no setup.</span>
        </h1>

        <p className="landing__lead">
          Create a room, share the link, start talking. Crystal-clear video and audio
          right in your browser — no account, no downloads, no fuss.
        </p>

        <div className="landing__actions">
          <button type="button" className="landing__cta" onClick={startCall}>
            Start a new call
            <span aria-hidden="true">→</span>
          </button>

          <form className="landing__join" onSubmit={joinCall}>
            <label className="visually-hidden" htmlFor="room-code">Room code or link</label>
            <input
              id="room-code"
              type="text"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setError('');
              }}
              placeholder="Paste a room link or code"
              autoComplete="off"
            />
            <button type="submit">Join</button>
          </form>
        </div>

        {error && <p className="landing__error" role="alert">{error}</p>}

        <p className="landing__hint">Free · Private · Works in any modern browser</p>
      </section>

      <section className="landing__features" aria-label="Why zCall">
        {features.map(({ icon: Icon, title, text }) => (
          <article className="landing__feature" key={title}>
            <span className="landing__feature-icon">{createElement(Icon)}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <footer className="landing__footer">
        <span>zCall</span>
        <span>
          Made with <IoHeart className="landing__heart" /> by{' '}
          <a href="https://github.com/carlmagumpara" target="_blank" rel="noopener noreferrer">
            carlmagumpara
          </a>
        </span>
      </footer>
    </main>
  );
}

export default Landing;
