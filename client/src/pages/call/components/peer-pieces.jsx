import { MdMic, MdMicOff } from 'react-icons/md';

export function PeerPlaceholder({ initial, large = false }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-tile">
      <span
        className={`grid place-items-center rounded-full bg-avatar-gradient font-bold text-white ${
          large ? 'h-[104px] w-[104px] text-[2.6rem]' : 'h-16 w-16 text-[1.6rem]'
        }`}
      >
        {initial}
      </span>
      <span className="text-xs text-muted">Camera off</span>
    </div>
  );
}

export function PeerName({ label, audio, large = false }) {
  return (
    <div
      className={`absolute inline-flex max-w-[calc(100%-20px)] items-center gap-2 rounded-full border border-stroke bg-surface-overlay text-ink backdrop-blur ${
        large ? 'bottom-[18px] left-[18px] px-3.5 py-2 text-sm' : 'bottom-2.5 left-2.5 px-2.5 py-1.5 text-xs'
      }`}
    >
      <span className="truncate">{label}</span>
      <span className={`inline-flex ${audio ? 'text-success' : 'text-danger-soft'}`}>
        {audio ? <MdMic /> : <MdMicOff />}
      </span>
    </div>
  );
}
