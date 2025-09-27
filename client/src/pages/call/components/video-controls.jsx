import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button, ButtonGroup } from 'react-bootstrap';
import { 
  FaVideo, 
  FaVideoSlash, 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaPhoneSlash, 
  FaShareSquare, 
  FaEllipsisV 
} from 'react-icons/fa';
import { 
  MdOutlineScreenShare, 
  MdOutlineStopScreenShare 
} from 'react-icons/md';
import { Form, Popconfirm, Modal, Select } from 'antd';
import { PiVideoConference } from 'react-icons/pi'
import { useVideoCall } from '../video-call-context';

function VideoControls() {
  const navigate = useNavigate();
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
    local_stream,
  } = useVideoCall();
  const [open, setOpen] = useState(false);

  // useEffect(() => {
  //   if(open) {
  //     const settingsVideoEl = document.getElementById("settings-video");
  //     if (settingsVideoEl) {
  //       settingsVideoEl.srcObject = local_stream;
  //     };
  //   }
  // }, [open, local_stream]);

  return (
    <>
      <ButtonGroup
        size="lg"
      >
        <Button
          variant={audio_enabled ? 'primary' : 'secondary'}
          onClick={() => setTrackEnabled("audio", !audio_enabled)}
        >
          {audio_enabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </Button>
        <Button
          variant={video_enabled ? 'primary' : 'secondary'}
          onClick={() => setTrackEnabled("video", !video_enabled)}
        >
          {video_enabled ? <FaVideo /> : <FaVideoSlash />}
        </Button>
        <Popconfirm
          title="Screen Share"
          description={screen_sharing ? `Are you sure you want to stop sharing your screen?` : `Are you sure you want to share your screen?`}
          onConfirm={() => screen_sharing ? stopScreenShare() : setupScreenShare()}
          onCancel={() => {}}
          okText="Yes"
          cancelText="No"
        >
          <Button
            variant={screen_sharing ? 'primary' : 'secondary'}
          >
            {screen_sharing ? <MdOutlineScreenShare /> : <MdOutlineStopScreenShare />}
          </Button>
        </Popconfirm>
        <Button
          variant={layout === 'single-grid' ? 'primary' : 'secondary'}
          onClick={() => setLayout(prevState => prevState === 'grid' ? 'single-grid' : 'grid')}
        >
          <PiVideoConference />
        </Button>
        <Button
          variant="secondary"
          onClick={() => setOpen(true)}
        >
          <FaEllipsisV />
        </Button>
        <Popconfirm
          title="Leave Call?"
          description="Are you sure you want to leave this call?"
          onConfirm={() => navigate('/')}
          onCancel={() => {}}
          okText="Yes"
          cancelText="No"
        >
          <Button
            variant="danger"
          >
            <FaPhoneSlash />
          </Button>
        </Popconfirm>
      </ButtonGroup>
      <Modal
        title="Settings"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={() => {}}
        onCancel={() => setOpen(false)}
      >
        <Form
          layout="vertical"
        >
{/*          <div className="settings-video-container">
            <video
              id="settings-video"
              autoPlay={true}
              playsInline={true}
              muted={true}
            />
          </div>*/}
          <Form.Item label="Camera">
            <Select 
              defaultValue={video_input_device_id}
              style={{ width: '100%' }}
              options={video_inputs.map(item => ({ label: item.label, value: item.deviceId }))} 
            />
          </Form.Item>
          <Form.Item label="Audio Input">
            <Select
              defaultValue={audio_input_device_id}
              style={{ width: '100%' }}
              options={audio_inputs.map(item => ({ label: item.label, value: item.deviceId }))} 
            />
          </Form.Item>
          <Form.Item label="Audio Output">
            <Select 
              defaultValue={audio_output_device_id}
              style={{ width: '100%' }}
              options={audio_outputs.map(item => ({ label: item.label, value: item.deviceId }))} 
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default VideoControls;