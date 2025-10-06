import { useState, useEffect, useRef } from 'react';
import {
  MdVideocam,
  MdVideocamOff,
  MdMic,
  MdMicOff,
  MdOutlineCallEnd,
  MdOutlineScreenShare,
  MdOutlineStopScreenShare,
  MdChatBubble,
  MdEmojiEmotions,
  MdMoreVert,
  MdOutlineArrowDropUp,
} from 'react-icons/md';
import EmojiPicker from 'emoji-picker-react';
import { Form, Modal, Select } from 'antd';
import { useVideoCall } from '../video-call-context';
import { useChat } from '../chat-context';
import { useRoom } from '../room-context';
import { socket } from '@/shared/socket';

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
  const { roomId } = useRoom();
  const { chat, setChat } = useChat();
  const [open, setOpen] = useState(false);
  
  const [emoji_picker, setShowEmojiPicker] = useState(false);
  const [audio_settings, setAudioSettings] = useState(false);
  const [video_settings, setVideoSettings] = useState(false);

  const emojiRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  const sendEmoji = emoji => {
    socket.emit('emoji', {
      room_id: roomId,
      data: emoji
    });
  };


  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (audioRef.current && !audioRef.current.contains(event.target)) {
        setAudioSettings(false);
      }
      if (videoRef.current && !videoRef.current.contains(event.target)) {
        setVideoSettings(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="vc-controls">
        <div 
          className="position-relative"
        >
          <div 
            className="position-relative"
          >
            <div 
              className="position-absolute"
              style={{
                right: -10,
                top: -10,
              }}
            >
              {audio_settings ? (
                <div
                  ref={audioRef}
                  className="position-absolute p-3 devices"
                  style={{
                    bottom: 20,
                    width: 400,
                    backgroundColor: '#ffffff'
                  }}
                >
                  <h6>Audio Input</h6>
                  <ul>
                    {audio_inputs.map((item) => (
                      <li>
                        <button
                          className={audio_input_device_id === item.deviceId ? 'active' : ''}
                          onClick={() => switchAudioInput(item.deviceId)}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <h6>Audio Output</h6>
                  <ul>
                    {audio_outputs.map((item) => (
                      <li>
                        <button
                          className={audio_output_device_id === item.deviceId ? 'active' : ''}
                          onClick={() => switchAudioOutput(item.deviceId)}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <MdOutlineArrowDropUp
                onClick={() => setAudioSettings(prevState => !prevState)}
                size={20} 
              />
            </div>
          </div>
          <button
            className={`btn toogle-buttons ${audio_enabled ? 'active' : ''}`}
            onClick={() => setTrackEnabled("audio", !audio_enabled)}
          >
            {audio_enabled ? <MdMic /> : <MdMicOff />}
          </button>
        </div>
        <div 
          className="position-relative"
        >
          <div 
            className="position-relative"
          >
            <div 
              className="position-absolute"
              style={{
                right: -10,
                top: -10,
              }}
            >
              {video_settings ? (
                <div
                  ref={videoRef}
                  className="position-absolute p-3 devices"
                >
                  <h6>Camera</h6>
                  <ul>
                    {video_inputs.map((item) => (
                      <li>
                        <button
                          className={video_input_device_id === item.deviceId ? 'active' : ''}
                          onClick={() => switchVideoInput(item.deviceId)}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <MdOutlineArrowDropUp
                onClick={() => setVideoSettings(prevState => !prevState)}
                size={20} 
              />
            </div>
          </div>
          <button
            className={`btn toogle-buttons ${video_enabled ? 'active' : ''}`}
            onClick={() => setTrackEnabled("video", !video_enabled)}
          >
            {video_enabled ? <MdVideocam /> : <MdVideocamOff />}
          </button>
        </div>
        <button
          className={`btn toogle-buttons ${screen_sharing ? 'active' : ''}`}
          onClick={() => (screen_sharing ? stopScreenShare() : setupScreenShare())}
        >
          {screen_sharing ? <MdOutlineScreenShare /> : <MdOutlineStopScreenShare />}
        </button>
        <div 
          className="position-relative"
        >
          {emoji_picker ? (
            <div
              ref={emojiRef}
              className="position-absolute"
              style={{
                bottom: 60
              }}
            >
              <EmojiPicker 
                reactionsDefaultOpen={true}
                onEmojiClick={sendEmoji}
                onReactionClick={sendEmoji}
              />
            </div>
          ) : null}
          <button
            className="btn toogle-buttons"
            onClick={() => setShowEmojiPicker(prevState => !prevState)}
          >
            <MdEmojiEmotions />
          </button>
        </div>
{/*        <button
          className={`btn ${chat ? 'active' : ''}`}
          onClick={() => setChat(prevState => !prevState)}
        >
          <MdChatBubble />
        </button>*/}
        <button 
          className="btn toogle-buttons end-call"
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
