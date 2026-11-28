import { useState } from 'react';
import {
  MdVideocam,
  MdVideocamOff,
  MdMic,
  MdMicOff,
  MdOutlineCallEnd,
  MdOutlineScreenShare,
  MdOutlineStopScreenShare,
  MdMoreVert
} from 'react-icons/md';
import { PiVideoConference, PiGridFour } from 'react-icons/pi';
import { useVideoCall } from '../video-call-context';
import CallControlButton from './call-control-button';
import ConfirmPopover from './confirm-popover';
import Modal from './modal';

function DeviceSelect({ id, label, value, devices, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-13 text-slate-label" htmlFor={id}>{label}</label>
      <select
        id={id}
        className="min-h-11 w-full cursor-pointer rounded-10 border border-stroke-strong bg-surface-input px-3.5 text-sm text-ink outline-none transition-colors focus:border-accent-input-border [&>option]:bg-[#0e1422] [&>option]:text-ink"
        value={value || devices[0]?.deviceId || ''}
        onChange={event => onChange(event.target.value)}
      >
        {devices.length === 0 && <option value="">No devices found</option>}
        {devices.map(item => (
          <option key={item.deviceId} value={item.deviceId}>
            {item.label || 'Unnamed device'}
          </option>
        ))}
      </select>
    </div>
  );
}

function VideoControls() {
  const {
    video_inputs,
    audio_inputs,
    audio_outputs,
    video_input_device_id,
    audio_input_device_id,
    audio_output_device_id,
    video_enabled,
    audio_enabled,
    screen_sharing,
    layout,
    setTrackEnabled,
    setupScreenShare,
    stopScreenShare,
    setLayout,
    switchVideoInput,
    switchAudioInput,
    switchAudioOutput,
    endCall
  } = useVideoCall();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2" role="toolbar" aria-label="Call controls">
        <CallControlButton
          state={audio_enabled ? 'on' : 'off'}
          onClick={() => setTrackEnabled('audio', !audio_enabled)}
          title={audio_enabled ? 'Mute microphone' : 'Unmute microphone'}
          aria-label={audio_enabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {audio_enabled ? <MdMic /> : <MdMicOff />}
          <span>{audio_enabled ? 'Mute' : 'Unmute'}</span>
        </CallControlButton>

        <CallControlButton
          state={video_enabled ? 'on' : 'off'}
          onClick={() => setTrackEnabled('video', !video_enabled)}
          title={video_enabled ? 'Turn camera off' : 'Turn camera on'}
          aria-label={video_enabled ? 'Turn camera off' : 'Turn camera on'}
        >
          {video_enabled ? <MdVideocam /> : <MdVideocamOff />}
          <span>{video_enabled ? 'Camera' : 'Start video'}</span>
        </CallControlButton>

        <ConfirmPopover
          title="Screen Share"
          description={
            screen_sharing
              ? 'Stop sharing your screen?'
              : 'Share your screen with everyone in the call?'
          }
          onConfirm={() => (screen_sharing ? stopScreenShare() : setupScreenShare())}
        >
          {(onOpen, open) => (
            <CallControlButton
              onClick={onOpen}
              aria-expanded={open}
              state={screen_sharing ? 'active' : 'default'}
              title={screen_sharing ? 'Stop sharing' : 'Share screen'}
              aria-label={screen_sharing ? 'Stop sharing' : 'Share screen'}
            >
              {screen_sharing ? <MdOutlineStopScreenShare /> : <MdOutlineScreenShare />}
              <span>{screen_sharing ? 'Stop share' : 'Share'}</span>
            </CallControlButton>
          )}
        </ConfirmPopover>

        <CallControlButton
          onClick={() => setLayout(layout === 'grid' ? 'single-grid' : 'grid')}
          title={layout === 'grid' ? 'Speaker view' : 'Gallery view'}
          aria-label={layout === 'grid' ? 'Speaker view' : 'Gallery view'}
        >
          {layout === 'grid' ? <PiVideoConference /> : <PiGridFour />}
          <span>{layout === 'grid' ? 'Speaker' : 'Gallery'}</span>
        </CallControlButton>

        <CallControlButton
          onClick={() => setOpen(true)}
          title="Device settings"
          aria-label="Device settings"
        >
          <MdMoreVert />
          <span>Settings</span>
        </CallControlButton>

        <ConfirmPopover
          title="Leave Call?"
          description="Are you sure you want to leave this call?"
          confirmLabel="Leave"
          tone="danger"
          onConfirm={() => endCall()}
        >
          {(onOpen, open) => (
            <CallControlButton
              onClick={onOpen}
              aria-expanded={open}
              state="end"
              title="Leave call"
              aria-label="Leave call"
            >
              <MdOutlineCallEnd />
              <span>Leave</span>
            </CallControlButton>
          )}
        </ConfirmPopover>
      </div>

      <Modal title="Device settings" open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <DeviceSelect
            id="camera-input"
            label="Camera"
            value={video_input_device_id}
            devices={video_inputs}
            onChange={value => switchVideoInput(value)}
          />
          <DeviceSelect
            id="audio-input"
            label="Audio Input"
            value={audio_input_device_id}
            devices={audio_inputs}
            onChange={value => switchAudioInput(value)}
          />
          <DeviceSelect
            id="audio-output"
            label="Audio Output"
            value={audio_output_device_id}
            devices={audio_outputs}
            onChange={value => switchAudioOutput(value)}
          />
        </div>
      </Modal>
    </>
  );
}

export default VideoControls;
