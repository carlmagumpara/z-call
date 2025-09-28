import { useState, useEffect } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
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
import { PiVideoConference } from 'react-icons/pi';
import { useVideoCall } from '../video-call-context';

function VideoControls() {
  const {
    video_inputs,
    audio_inputs,
    audio_outputs,
    video_input_device_id,
    audio_input_device_id,
    audio_output_device_id,
    setVideoInputDeviceId,
    setAudioInputDeviceId,
    setAudioOutputDeviceId,
    video_enabled,
    audio_enabled,
    screen_sharing,
    layout,
    setTrackEnabled,
    setupScreenShare,
    stopScreenShare,
    setLayout,
    initializeLocalStream,
    endCall
  } = useVideoCall();
  const [open, setOpen] = useState(false);

  return (
    <>
      <ButtonGroup size="lg">
        <Button
          variant={audio_enabled ? 'primary' : 'secondary'}
          onClick={() => setTrackEnabled("audio", !audio_enabled)}
        >
          {audio_enabled ? <MdMic /> : <MdMicOff />}
        </Button>
        <Button
          variant={video_enabled ? 'primary' : 'secondary'}
          onClick={() => setTrackEnabled("video", !video_enabled)}
        >
          {video_enabled ? <MdVideocam /> : <MdVideocamOff />}
        </Button>
        <Popconfirm
          title="Screen Share"
          description={
            screen_sharing
              ? `Are you sure you want to stop sharing your screen?`
              : `Are you sure you want to share your screen?`
          }
          onConfirm={() => (screen_sharing ? stopScreenShare() : setupScreenShare())}
          onCancel={() => {}}
          okText="Yes"
          cancelText="No"
        >
          <Button variant={screen_sharing ? 'primary' : 'secondary'}>
            {screen_sharing ? <MdOutlineScreenShare /> : <MdOutlineStopScreenShare />}
          </Button>
        </Popconfirm>
        <Button variant="secondary" onClick={() => {}}>
          <MdChatBubble />
        </Button>
        <Button
          variant={layout === 'single-grid' ? 'primary' : 'secondary'}
          onClick={() =>
            setLayout((prevState) =>
              prevState === 'grid' ? 'single-grid' : 'grid'
            )
          }
        >
          <PiVideoConference />
        </Button>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <MdMoreVert />
        </Button>
        <Popconfirm
          title="Leave Call?"
          description="Are you sure you want to leave this call?"
          onConfirm={() => endCall()}
          onCancel={() => {}}
          okText="Yes"
          cancelText="No"
        >
          <Button variant="danger">
            <MdOutlineCallEnd />
          </Button>
        </Popconfirm>
      </ButtonGroup>
      <Modal
        title="Settings"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        okText="Done"
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        cancelButtonProps={{ style: { display: 'none' } }}
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
              onChange={value => setVideoInputDeviceId(value)}
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
              onChange={value => setAudioInputDeviceId(value)}
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
              onChange={value => setAudioOutputDeviceId(value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default VideoControls;
