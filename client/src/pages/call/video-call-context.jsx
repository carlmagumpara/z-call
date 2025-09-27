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

  const [video_input_device_id, setVideoInputDeviceId] = useState('');
  const [audio_input_device_id, setAudioInputDeviceId] = useState('');
  const [audio_output_device_id, setAudioOutputDeviceId] = useState('');

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
      const stream = await navigator.mediaDevices.getUserMedia(defaultMediaConfig);
      stream.getVideoTracks().forEach(track => track.enabled = video_enabled);
      stream.getAudioTracks().forEach(track => track.enabled = audio_enabled);
      setVideoInputDeviceId(stream.getVideoTracks()[0].getSettings().deviceId);
      setAudioInputDeviceId(stream.getAudioTracks()[0].getSettings().deviceId);
      setLocalStream(stream);
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

  const switchVideo = async (deviceId) => {
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { 
          deviceId: { 
          exact: deviceId 
        } 
      },
      audio: false,
    });

    const newTrack = newStream.getVideoTracks()[0];
    // setLocalStream(newStream);
    
    // if (pc) {
    //   const sender = pc.getSenders().find(s => s.track?.kind === "video");
    //   if (sender) await sender.replaceTrack(newTrack);
    // }

    // const oldTrack = localStream?.getVideoTracks()[0];
    // if (oldTrack) {
    //   oldTrack.stop();
    //   localStream.removeTrack(oldTrack);
    // }
    // localStream.addTrack(newTrack);

    // videoEl.srcObject = localStream;
  };

  const switchAudioInput = async (deviceId) => {
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
      video: false,
    });

    // const newTrack = newStream.getAudioTracks()[0];

    // if (pc) {
    //   const sender = pc.getSenders().find(s => s.track?.kind === "audio");
    //   if (sender) await sender.replaceTrack(newTrack);
    // }

    // const oldTrack = localStream?.getAudioTracks()[0];
    // if (oldTrack) {
    //   oldTrack.stop();
    //   localStream.removeTrack(oldTrack);
    // }
    // localStream.addTrack(newTrack);

    // videoEl.srcObject = localStream;
  };

  const switchAudioOutput = async (deviceId) => {
    // if (typeof videoEl.sinkId !== "undefined") {
    //   try {
    //     await videoEl.setSinkId(deviceId);
    //     console.log(`Audio output set to device: ${deviceId}`);
    //   } catch (err) {
    //     console.error("Error setting audio output:", err);
    //   }
    // } else {
    //   console.warn("Audio output selection is not supported in this browser.");
    // }
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