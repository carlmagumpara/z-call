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
import { Form, Popconfirm, Modal, Select } from 'antd';
import { useVideoCall } from '../video-call-context';
import CallControlButton from './call-control-button';

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

        <Popconfirm
          title="Screen Share"
          description={
            screen_sharing
              ? 'Stop sharing your screen?'
              : 'Share your screen with everyone in the call?'
          }
          onConfirm={() => (screen_sharing ? stopScreenShare() : setupScreenShare())}
          onCancel={() => {}}
          okText="Yes"
          cancelText="No"
        >
          <CallControlButton
            state={screen_sharing ? 'active' : 'default'}
            title={screen_sharing ? 'Stop sharing' : 'Share screen'}
            aria-label={screen_sharing ? 'Stop sharing' : 'Share screen'}
          >
            {screen_sharing ? <MdOutlineStopScreenShare /> : <MdOutlineScreenShare />}
            <span>{screen_sharing ? 'Stop share' : 'Share'}</span>
          </CallControlButton>
        </Popconfirm>

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

        <Popconfirm
          title="Leave Call?"
          description="Are you sure you want to leave this call?"
          onConfirm={() => endCall()}
          onCancel={() => {}}
          okText="Yes"
          cancelText="No"
        >
          <CallControlButton state="end" title="Leave call" aria-label="Leave call">
            <MdOutlineCallEnd />
            <span>Leave</span>
          </CallControlButton>
        </Popconfirm>
      </div>

      <Modal
        title="Device settings"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        okText="Done"
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        cancelButtonProps={{ className: '!hidden' }}
      >
        <Form layout="vertical">
          <Form.Item label="Camera">
            <Select
              defaultValue={video_input_device_id}
              className="!w-full"
              options={video_inputs.map((item) => ({
                label: item.label,
                value: item.deviceId,
              }))}
              onChange={value => switchVideoInput(value)}
            />
          </Form.Item>
          <Form.Item label="Audio Input">
            <Select
              defaultValue={audio_input_device_id}
              className="!w-full"
              options={audio_inputs.map((item) => ({
                label: item.label,
                value: item.deviceId,
              }))}
              onChange={value => switchAudioInput(value)}
            />
          </Form.Item>
          <Form.Item label="Audio Output">
            <Select
              defaultValue={audio_output_device_id}
              className="!w-full"
              options={audio_outputs.map((item) => ({
                label: item.label,
                value: item.deviceId,
              }))}
              onChange={value => switchAudioOutput(value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default VideoControls;
