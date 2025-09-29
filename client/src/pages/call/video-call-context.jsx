import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

const Context = createContext();

export const useVideoCall = () => useContext(Context);

function VideoCallProvider({ children }) {
  const navigate = useNavigate();
  const pc = useRef({});
  const audio = useRef({});
  const [video_enabled, setVideoEnabled] = useState(false);
  const [audio_enabled, setAudioEnabled] = useState(false);
  const [video_inputs, setVideoInputs] = useState([]);
  const [audio_inputs, setAudioInputs] = useState([]);
  const [audio_outputs, setAudioOutputs] = useState([]);
  const [local_stream, setLocalStream] = useState(null);
  const [screen_stream, setScreenStream] = useState(null);
  const [screen_sharing, setScreenSharing] = useState(false);
  const [layout, setLayout] = useState('single-grid');
  const [media_status, setMediaStatus] = useState({});
  const [video_input_device_id, setVideoInputDeviceId] = useState(null);
  const [audio_input_device_id, setAudioInputDeviceId] = useState(null);
  const [audio_output_device_id, setAudioOutputDeviceId] = useState(null);

  const defaultMediaConfig = { 
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 60 }
    },
    audio: true,
  };

  const constraints = {
    video: video_input_device_id
      ? {
          deviceId: { exact: video_input_device_id },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 60 },
        }
      : defaultMediaConfig.video,

    audio: audio_input_device_id
      ? { deviceId: { exact: audio_input_device_id } }
      : defaultMediaConfig.audio,
  };

  const getMediaDevices = async (kind) => {
    if(!kind) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === kind);
  };

  const setTrackEnabled = (type, enabled) => {
    const tracks = type === "audio" 
      ? local_stream.getAudioTracks() 
      : local_stream.getVideoTracks();

    tracks.forEach(track => track.enabled = enabled);

    if(type === 'audio') {
      setAudioEnabled(enabled);
    } else {
      setVideoEnabled(enabled);
    }
  };

  const addPcStreamsTrack = (stream, kind = null) => {
    if (!stream) return;

    Object.keys(pc.current || {}).forEach(peerId => {
      for (const type of ['main', 'screen']) {
        const senders = pc.current[peerId]?.[type]?.getSenders();

        if (kind === null || kind === 'video') {
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            stream.getVideoTracks().forEach(track => (track.enabled = video_enabled));
            const newVideoTrack = stream.getVideoTracks()[0];
            if (newVideoTrack) videoSender.replaceTrack(newVideoTrack);
          }
        }

        if (kind === null || kind === 'audio') {
          const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
          if (audioSender) {
            stream.getAudioTracks().forEach(track => (track.enabled = audio_enabled));
            const newAudioTrack = stream.getAudioTracks()[0];
            if (newAudioTrack) audioSender.replaceTrack(newAudioTrack);
          }
        }
      }
    });
  };

  const removePcStreamsTrack = (type, kind = null) => {
    Object.keys(pc.current || {}).forEach(peerId => {
      const conn = pc.current[peerId]?.[type];
      if (!conn) return;

      conn.getSenders().forEach(sender => {
        const track = sender.track;
        if (!track) return;

        if (!kind || track.kind === kind) {
          try {
            track.stop();
            conn.removeTrack(sender);
            console.log(`Stopped & removed ${track.kind} track from ${peerId} (${type})`);
          } catch (err) {
            console.warn(`Failed to remove track ${track.kind} from ${peerId}`, err);
          }
        }
      });

      try {
        conn.close();
        console.log(`Closed connection for ${peerId} (${type})`);
      } catch (err) {
        console.warn(`Error closing connection for ${peerId} (${type})`, err);
      }

      if (pc.current[peerId]) {
        delete pc.current[peerId][type];
      }

      console.log(pc.current[peerId]);
    });
  };

  const replaceTrack = (newTrack, kind) => {
    if (!local_stream || !newTrack) return;

    const oldTrack = local_stream.getTracks().find(t => t.kind === kind);
    if (oldTrack) {
      oldTrack.stop();
      local_stream.removeTrack(oldTrack);
    }

    local_stream.addTrack(newTrack);
  };

  const initializeLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getVideoTracks().forEach(track => track.enabled = video_enabled);
      stream.getAudioTracks().forEach(track => track.enabled = audio_enabled);
      setVideoInputDeviceId(stream.getVideoTracks()[0].getSettings().deviceId);
      setAudioInputDeviceId(stream.getAudioTracks()[0].getSettings().deviceId);
      addPcStreamsTrack(stream);
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Failed to get local stream", err);
    }
  };

  const setupScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(defaultMediaConfig);
      const screenTrack = stream.getVideoTracks()[0];
      screenTrack.onended = async () => stopScreenShare();      
      setScreenStream(stream);
      setScreenSharing(true);
      return true;
    } catch (err) {
      console.error("Failed to get local stream", err);
      return false;
    }
  };

  const stopScreenShare = async () => {
    console.log("Screen sharing has ended");
    try {
      screen_stream?.getTracks().forEach(track => {
        track.stop();
      });
      setScreenStream(null);
      setScreenSharing(false);
      removePcStreamsTrack('screen', 'video');
      return true;
    } catch (err) {
      console.error("Error restoring camera:", err);
      return false;
    }
  };

  const switchVideoInput = async (deviceId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { 
            exact: deviceId 
          },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false
      });
      stream.getVideoTracks().forEach(track => track.enabled = video_enabled);
      const videoTrack = stream.getVideoTracks()[0];
      replaceTrack(videoTrack, 'video');
      addPcStreamsTrack(stream, 'video');
      setVideoInputDeviceId(deviceId);
      return true;
    } catch (err) {
      console.error("Error restoring camera:", err);
      return false;
    }
  };

  const switchAudioInput = async (deviceId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          deviceId: { 
            exact: deviceId 
          },
        },
        video: false
      });
      stream.getAudioTracks().forEach(track => track.enabled = audio_enabled);
      const audioTrack = stream.getAudioTracks()[0];
      replaceTrack(audioTrack, 'audio');
      addPcStreamsTrack(stream, 'audio');
      setAudioInputDeviceId(deviceId);
      return true;
    } catch (err) {
      console.error("Error restoring camera:", err);
      return false;
    }
  };

  const switchAudioOutput = async (deviceId) => {
    await Promise.all(
      Object.keys(pc.current || {}).map(async (peerId) => {
        const remoteAudioEl = document.getElementById(`remote-audio-${peerId}`);
        if (remoteAudioEl && typeof remoteAudioEl.setSinkId === "function") {
          try {
            await remoteAudioEl.setSinkId(deviceId);
            console.log(`Audio output switched for peer ${peerId}`);
          } catch (err) {
            console.error(`Failed to setSinkId for peer ${peerId}:`, err);
          }
        }
      })
    );
    setAudioOutputDeviceId(deviceId);
  };

  const endCall = () => {
    local_stream?.getTracks().forEach(track => track.stop());
    screen_stream?.getTracks().forEach(track => track.stop());
    navigate('/');
  };

  useEffect(() => {
    const initMediaDevices = async () => {
      const video_inputs = await getMediaDevices('videoinput');
      const audio_inputs = await getMediaDevices('audioinput');
      const audio_outputs = await getMediaDevices('audiooutput');
      const default_audio_output = audio_outputs.find(d => d.deviceId === "default");

      setVideoInputs(video_inputs);
      setAudioInputs(audio_inputs);
      setAudioOutputs(audio_outputs);
      setAudioOutputDeviceId(default_audio_output?.deviceId ?? null);
    };

    navigator.mediaDevices.ondevicechange = () => initMediaDevices();

    initMediaDevices();
  }, []);

  return (
    <Context.Provider
      value={{
        pc,
        audio,
        video_enabled,
        audio_enabled,
        video_inputs,
        audio_inputs,
        audio_outputs,
        video_input_device_id,
        audio_input_device_id,
        audio_output_device_id,
        local_stream,
        screen_stream,
        screen_sharing,
        layout,
        media_status, 
        setVideoInputDeviceId,
        setAudioInputDeviceId,
        setAudioOutputDeviceId,
        setScreenStream,
        setScreenSharing,
        initializeLocalStream,
        setupScreenShare,
        stopScreenShare,
        setVideoEnabled,
        setAudioEnabled,
        setTrackEnabled,
        setLayout,
        setMediaStatus,
        switchVideoInput,
        switchAudioInput,
        switchAudioOutput,
        endCall
      }}
    >
      {children}
    </Context.Provider>
  )
}

export default VideoCallProvider;
