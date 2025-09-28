import { createContext, useContext, useState, useEffect, useRef } from 'react';

const Context = createContext();

export const useVideoCall = () => useContext(Context);

function VideoCallProvider({ children }) {
  const pc = useRef({});
  const audio = useRef({});
  const [video_enabled, setVideoEnabled] = useState(false);
  const [audio_enabled, setAudioEnabled] = useState(false);
  const [video_inputs, setVideoInputs] = useState([]);
  const [audio_inputs, setAudioInputs] = useState([]);
  const [audio_outputs, setAudioOutputs] = useState([]);
  const [local_stream, setLocalStream] = useState(null);
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

  const updatePcStreams = (stream) => {
    if (!stream) return;

    stream.getVideoTracks().forEach(track => track.enabled = video_enabled);
    stream.getAudioTracks().forEach(track => track.enabled = audio_enabled);

    Object.keys(pc.current || {}).forEach(sid => {
      const senders = pc.current[sid].getSenders();

      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender) {
        const newVideoTrack = stream.getVideoTracks()[0];
        videoSender.replaceTrack(newVideoTrack);
      }

      const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
      if (audioSender) {
        const newAudioTrack = stream.getAudioTracks()[0];
        audioSender.replaceTrack(newAudioTrack);
      }
    });
  };

  const replaceTrack = (kind, newTrack) => {
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

      if (local_stream) {
        local_stream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getVideoTracks().forEach(track => track.enabled = video_enabled);
      stream.getAudioTracks().forEach(track => track.enabled = audio_enabled);

      if(!video_input_device_id) {
        setVideoInputDeviceId(stream.getVideoTracks()[0].getSettings().deviceId);
      }
      
      if(!audio_input_device_id) {
        setAudioInputDeviceId(stream.getAudioTracks()[0].getSettings().deviceId);
      }

      updatePcStreams(stream);
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Failed to get local stream", err);
    }
  };

  const setupScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia(defaultMediaConfig);
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrack.onended = async () => stopScreenShare();
      replaceTrack('video', screenTrack);
      updatePcStreams(screenStream);
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
      await initializeLocalStream();
      setScreenSharing(false);
      return true;
    } catch (err) {
      console.error("Error restoring camera:", err);
      return false;
    }
  };

  useEffect(() => {
    return () => local_stream?.getTracks().forEach(track => track.stop());
  }, []);

  useEffect(() => {
    const initMediaDevices = async () => {
      const video_inputs = await getMediaDevices('videoinput');
      const audio_inputs = await getMediaDevices('audioinput');
      const audio_outputs = await getMediaDevices('audiooutput');
      const default_audio_output = audio_outputs.find(d => d.deviceId === "default");

      setVideoInputs(video_inputs);
      setAudioInputs(audio_inputs);
      setAudioOutputs(audio_outputs);
      setAudioOutputDeviceId(default_audio_output.deviceId);
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
        setVideoInputDeviceId,
        setAudioInputDeviceId,
        setAudioOutputDeviceId,
        local_stream,
        screen_sharing,
        layout,
        setScreenSharing,
        initializeLocalStream,
        setupScreenShare,
        stopScreenShare,
        setVideoEnabled,
        setAudioEnabled,
        setTrackEnabled,
        setLayout,
        media_status, 
        setMediaStatus
      }}
    >
      {children}
    </Context.Provider>
  )
}

export default VideoCallProvider;
