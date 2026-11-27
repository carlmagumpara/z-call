const STATE_CLASSES = {
  default: 'border-stroke bg-surface-strong hover:bg-surface-hover',
  on: 'border-on-border bg-on-bg hover:bg-surface-hover',
  off: 'border-off-border bg-off-bg text-danger-soft hover:bg-surface-hover',
  active: 'border-active-border bg-active-bg text-success-soft hover:bg-surface-hover',
  end: 'w-[72px] border-transparent bg-end-call text-white hover:bg-end-call-hover max-[760px]:w-[62px]',
};

function CallControlButton({ state = 'default', className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-control w-[62px] cursor-pointer flex-col items-center justify-center gap-[3px] rounded-13 border px-1 py-1.5 text-[1.15rem] transition-[background-color,border-color,transform] duration-200 ease-in-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none [&>span]:text-10 [&>span]:leading-none max-[760px]:min-h-control-sm max-[760px]:w-[54px] max-[760px]:text-[1.1rem] max-[760px]:[&>span]:hidden ${STATE_CLASSES[state]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default CallControlButton;
