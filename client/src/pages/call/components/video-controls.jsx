import { useState, useEffect } from 'react';
import {
  MdVideocam,
  MdVideocamOff,
  MdMic,
  MdMicOff,
  MdOutlineCallEnd,
  MdOutlineScreenShare,
  MdOutlineStopScreenShare,
  MdChatBubble,
  MdMoreVert
} from 'react-icons/md';
import { Form, Popconfirm, Modal, Select } from 'antd';
import { useVideoCall } from '../video-call-context';
import { useChat } from '../chat-context';

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
  const { chat, setChat } = useChat();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="vc-controls">
        <button
          className={`btn ${audio_enabled ? 'active' : ''}`}
          onClick={() => setTrackEnabled("audio", !audio_enabled)}
        >
          {audio_enabled ? <MdMic /> : <MdMicOff />}
        </button>
        <button
          className={`btn ${video_enabled ? 'active' : ''}`}
          onClick={() => setTrackEnabled("video", !video_enabled)}
        >
          {video_enabled ? <MdVideocam /> : <MdVideocamOff />}
        </button>
        <button
          className={`btn ${screen_sharing ? 'active' : ''}`}
          onClick={() => (screen_sharing ? stopScreenShare() : setupScreenShare())}
        >
          {screen_sharing ? <MdOutlineScreenShare /> : <MdOutlineStopScreenShare />}
        </button>
        <button
          className={`btn ${chat ? 'active' : ''}`}
          onClick={() => setChat(prevState => !prevState)}
        >
          <MdChatBubble />
        </button>
        <button
          className="btn"
          onClick={() => setOpen(true)}
        >
          <MdMoreVert />
        </button>
        <button 
          className="btn end-call"
          onClick={() => endCall()}
        >
          <MdOutlineCallEnd />
        </button>
      </div>
      <Modal
        title="Settings"
        closable={{ 'aria-label': 'Custom Close button' }}
        open={open}
        okText="Done"
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        cancelbuttonProps={{ style: { display: 'none' } }}
      >
        <Form layout="vertical">
          <Form.Item label="Camera">
            <Select
              defaultValue={video_input_device_id}
              style={{ width: '100%' }}
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
              style={{ width: '100%' }}
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
              style={{ width: '100%' }}
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
