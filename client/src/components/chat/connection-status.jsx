import { IoWifiOutline, IoRefreshOutline } from 'react-icons/io5';

function ConnectionStatus({ status }) {
  const connected = status === 'connected';

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-11 whitespace-nowrap ${
        connected
          ? 'border-active-border bg-active-bg text-success-soft'
          : 'border-off-border bg-off-bg text-danger-soft'
      }`}
      role="status"
      aria-live="polite"
    >
      {connected ? <IoWifiOutline /> : <IoRefreshOutline className="animate-spin motion-reduce:animate-none" />}
      {connected ? 'Live' : 'Reconnecting'}
    </span>
  );
}

export default ConnectionStatus;
