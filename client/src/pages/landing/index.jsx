import { useNavigate } from 'react-router';
import { useState } from 'react';
import { IoHeart, IoVideocamOutline, IoLinkOutline, IoSparklesOutline } from 'react-icons/io5';
import { usePresence } from '@/contexts/presence';
import { v4 as uuidv4 } from 'uuid';
import FeatureCard from './feature-card';

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
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-landing-bg px-6 pt-[104px] font-sans text-ink max-[760px]:px-[18px] max-[760px]:pt-[88px]">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <span className="absolute -left-[8vw] -top-[12vw] h-[38vw] min-h-80 w-[38vw] min-w-80 animate-landing-drift rounded-full bg-accent opacity-40 blur-90 motion-reduce:animate-none" />
        <span className="absolute -right-[10vw] top-[4vw] h-[38vw] min-h-80 w-[38vw] min-w-80 animate-landing-drift rounded-full bg-accent-two opacity-[0.28] blur-90 [animation-delay:-8s] motion-reduce:animate-none" />
        <span className="absolute inset-0 bg-grid bg-[length:72px_72px] opacity-35 [mask-image:linear-gradient(to_bottom,transparent,#000_25%,#000_70%,transparent)]" />
      </div>

      <section className="mx-auto w-full max-w-920 animate-landing-rise pb-[clamp(56px,9vh,96px)] pt-[clamp(48px,10vh,120px)] text-center motion-reduce:animate-none">
        <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-stroke-soft bg-white/5 px-4 py-2 text-13 tracking-[0.01em] text-slate-label backdrop-blur-md">
          <span className="h-2 w-2 animate-landing-pulse rounded-full bg-success shadow-pulse motion-reduce:animate-none" />
          {users.length} {users.length === 1 ? 'person' : 'people'} online now
        </div>

        <h1 className="m-0 text-[clamp(3.2rem,9vw,6.6rem)] font-extrabold leading-[0.98] tracking-[-0.055em]">
          Good calls,
          <br />
          <span className="bg-title-gradient bg-clip-text text-transparent">no setup.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-620 text-[clamp(1rem,2vw,1.2rem)] leading-[1.65] text-muted">
          Create a room, share the link, start talking. Crystal-clear video and audio
          right in your browser — no account, no downloads, no fuss.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
          <button
            type="button"
            className="group inline-flex min-h-14 items-center gap-3 rounded-14 bg-cta px-7 text-base font-semibold text-white shadow-cta transition-[transform,box-shadow,filter] duration-200 ease-in-out hover:-translate-y-0.5 hover:brightness-105 hover:shadow-cta-hover active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent-two max-[760px]:w-full max-[760px]:justify-center"
            onClick={startCall}
          >
            Start a new call
            <span className="text-xl transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
              →
            </span>
          </button>

          <form
            className="flex min-h-14 items-center rounded-14 border border-stroke-strong bg-white/5 py-[5px] pl-[18px] pr-[6px] backdrop-blur-14 transition-colors duration-200 focus-within:border-accent-input-border focus-within:bg-white/[0.08] max-[760px]:w-full"
            onSubmit={joinCall}
          >
            <label className="sr-only" htmlFor="room-code">Room code or link</label>
            <input
              id="room-code"
              type="text"
              className="min-h-11 w-[min(240px,45vw)] border-0 bg-transparent text-[0.95rem] text-ink outline-none placeholder:text-placeholder max-[760px]:w-full max-[760px]:flex-1"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setError('');
              }}
              placeholder="Paste a room link or code"
              autoComplete="off"
            />
            <button
              type="submit"
              className="min-h-11 rounded-10 bg-surface-button px-[18px] text-ink font-semibold transition-colors duration-200 hover:bg-surface-button-hover"
            >
              Join
            </button>
          </form>
        </div>

        {error && <p className="mb-0 mt-[14px] text-[0.9rem] text-danger-soft" role="alert">{error}</p>}

        <p className="mb-0 mt-[22px] text-[0.82rem] tracking-[0.03em] text-muted-dark">
          Free · Private · Works in any modern browser
        </p>
      </section>

      <section className="mx-auto grid w-full max-w-1040 grid-cols-3 gap-[18px] pb-[72px] max-[760px]:grid-cols-1 max-[760px]:pb-12" aria-label="Why zCall">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </section>

      <footer className="mx-auto mt-auto flex w-full max-w-1040 flex-wrap justify-between gap-3 border-t border-white/[0.07] pb-7 pt-[22px] text-[0.82rem] text-muted-dark">
        <span>zCall</span>
        <span>
          Made with <IoHeart className="text-danger" /> by{' '}
          <a
            className="text-muted no-underline hover:text-ink"
            href="https://github.com/carlmagumpara"
            target="_blank"
            rel="noopener noreferrer"
          >
            carlmagumpara
          </a>
        </span>
      </footer>
    </main>
  );
}

export default Landing;
