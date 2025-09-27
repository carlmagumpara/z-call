import { createContext, useContext, useState, useEffect } from 'react';

const Context = createContext();

export const useVideoCall = () => useContext(Context);

const defaultMediaConfig = { 
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 60 }
  },
  audio: true,
};

function VideoCallProvider({ children }) {
  const [video_enabled, setVideoEnabled] = useState(false);
  const [audio_enabled, setAudioEnabled] = useState(false);
  const [video_inputs, setVideoInputs] = useState([]);
  const [audio_inputs, setAudioInputs] = useState([]);
  const [audio_outputs, setAudioOutputs] = useState([]);
  const [local_stream, setLocalStream] = useState(null);
  const [screen_stream, setScreenStream] = useState(null);
  const [screen_sharing, setScreenSharing] = useState(false);
  const [layout, setLayout] = useState('single-grid');

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

  const setupLocalStream = async () => {
    try {
      const local_stream = await navigator.mediaDevices.getUserMedia(defaultMediaConfig);
      local_stream.getVideoTracks().forEach(track => track.enabled = video_enabled);
      local_stream.getAudioTracks().forEach(track => track.enabled = audio_enabled);
      setLocalStream(local_stream);
    } catch (err) {
      console.error("Failed to get local stream", err);
    }
  };

  const stopScreenShare = async () => {
    console.log("Screen sharing has ended");
    try {
      const newStream = await navigator.mediaDevices.getUserMedia(defaultMediaConfig);
      const newVideoTrack = newStream.getVideoTracks()[0];
      const newAudioTrack = newStream.getAudioTracks()[0];
      if (newVideoTrack) newVideoTrack.enabled = video_enabled;
      if (newAudioTrack) newAudioTrack.enabled = audio_enabled;
      const oldVideoTrack = local_stream?.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
        local_stream.removeTrack(oldVideoTrack);
      }
      local_stream.addTrack(newVideoTrack);
      if (newAudioTrack) {
        const oldAudioTrack = local_stream?.getAudioTracks()[0];
        if (oldAudioTrack) {
          oldAudioTrack.stop();
          local_stream.removeTrack(oldAudioTrack);
        }
        local_stream.addTrack(newAudioTrack);
      }

      setLocalStream(newStream);
      setScreenStream(null);
      setScreenSharing(false);
    } catch (err) {
      console.error("Error restoring camera:", err);
    }
  };

  const setupScreenShare = async () => {
    try {
      const screen_stream = await navigator.mediaDevices.getDisplayMedia(defaultMediaConfig);
      const screen_track = screen_stream.getVideoTracks()[0];
      screen_track.onended = async () => stopScreenShare();
      local_stream.removeTrack(local_stream.getVideoTracks()[0]);
      local_stream.addTrack(screen_track);
      setScreenStream(screen_stream);
      setScreenSharing(true);
    } catch (err) {
      console.error("Failed to get local stream", err);
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

      setVideoInputs(video_inputs);
      setAudioInputs(audio_inputs);
      setAudioOutputs(audio_outputs);
    };

    initMediaDevices();
  }, []);

  return (
    <Context.Provider
      value={{
        video_enabled,
        audio_enabled,
        video_inputs,
        audio_inputs,
        audio_outputs,
        local_stream,
        screen_stream,
        screen_sharing,
        layout,
        setScreenSharing,
        setupLocalStream,
        setupScreenShare,
        stopScreenShare,
        setVideoEnabled,
        setAudioEnabled,
        setTrackEnabled,
        setLayout
      }}
    >
      {children}
    </Context.Provider>
  )
}

export default VideoCallProvider;