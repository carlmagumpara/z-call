import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

const Context = createContext();

export const useVideoCall = () => useContext(Context);

function VideoCallProvider({ children }) {
  const navigate = useNavigate();
  const pc = useRef({});
  const audio = useRef({});
  const localStreamRef = useRef(null);
  const videoEnabledRef = useRef(false);
  const audioEnabledRef = useRef(false);
  const screenSharingRef = useRef(false);
  const initializingRef = useRef(false);

  const [video_enabled, _setVideoEnabled] = useState(false);
  const [audio_enabled, _setAudioEnabled] = useState(false);

  // Keep refs in sync so async handlers (getUserMedia, socket events and track
  // replacement) always apply the latest camera/mic preference.
  const setVideoEnabled = (enabled) => {
    videoEnabledRef.current = enabled;
    _setVideoEnabled(enabled);
  };

  const setAudioEnabled = (enabled) => {
    audioEnabledRef.current = enabled;
    _setAudioEnabled(enabled);
  };
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

  const applyTrackState = (type, enabled) => {
    // The live screen track must stay on even if the camera toggle is pressed.
    if (type === 'video' && screenSharingRef.current) return;

    const stream = localStreamRef.current;
    const tracks = type === 'audio'
      ? stream?.getAudioTracks()
      : stream?.getVideoTracks();

    tracks?.forEach(track => { track.enabled = enabled; });

    // Screen-share and replaced tracks may no longer be in local_stream, so
    // update the senders too — otherwise peers keep seeing a black frame.
    Object.values(pc.current || {}).forEach(conn => {
      conn.getSenders().forEach(sender => {
        if (sender.track && sender.track.kind === type) {
          sender.track.enabled = enabled;
        }
      });
    });
  };

  const setTrackEnabled = (type, enabled) => {
    if (type === 'audio') {
      setAudioEnabled(enabled);
    } else {
      setVideoEnabled(enabled);
    }
    // Works even before getUserMedia resolves: initializeLocalStream applies
    // the stored preference as soon as the stream is available.
    applyTrackState(type, enabled);
  };

  const updatePcStreams = (stream, kind = null) => {
    if (!stream) return;

    Object.keys(pc.current || {}).forEach(peerId => {
      const senders = pc.current[peerId].getSenders();

      if (kind === null || kind === 'video') {
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        const newVideoTrack = stream.getVideoTracks()[0];
        if (videoSender && newVideoTrack) {
          newVideoTrack.enabled = videoEnabledRef.current;
          videoSender.replaceTrack(newVideoTrack);
        }
      }

      if (kind === null || kind === 'audio') {
        const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
        const newAudioTrack = stream.getAudioTracks()[0];
        if (audioSender && newAudioTrack) {
          newAudioTrack.enabled = audioEnabledRef.current;
          audioSender.replaceTrack(newAudioTrack);
        }
      }
    });
  };

  const replaceTrack = (newTrack, kind) => {
    const stream = localStreamRef.current;
    if (!stream || !newTrack) return;

    const oldTrack = stream.getTracks().find(t => t.kind === kind);
    if (oldTrack) {
      oldTrack.stop();
      stream.removeTrack(oldTrack);
    }

    stream.addTrack(newTrack);

    // Publish a new MediaStream object so every <video> reattaches to the
    // replacement track instead of holding a stream whose frames stopped.
    const nextStream = new MediaStream(stream.getTracks());
    localStreamRef.current = nextStream;
    setLocalStream(nextStream);
  };

  const initializeLocalStream = async () => {
    if (initializingRef.current || localStreamRef.current) {
      return localStreamRef.current;
    }

    initializingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      stream.getVideoTracks().forEach(track => { track.enabled = videoEnabledRef.current; });
      stream.getAudioTracks().forEach(track => { track.enabled = audioEnabledRef.current; });

      const videoDeviceId = stream.getVideoTracks()[0]?.getSettings?.().deviceId;
      const audioDeviceId = stream.getAudioTracks()[0]?.getSettings?.().deviceId;
      if (videoDeviceId) setVideoInputDeviceId(videoDeviceId);
      if (audioDeviceId) setAudioInputDeviceId(audioDeviceId);

      updatePcStreams(stream);
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Failed to get local stream", err);
      return null;
    } finally {
      initializingRef.current = false;
    }
  };

  const setupScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(defaultMediaConfig);
      const screenTrack = stream.getVideoTracks()[0];
      // A shared screen must stay live even when the camera is toggled off.
      screenTrack.enabled = true;
      screenTrack.onended = async () => stopScreenShare();
      replaceTrack(screenTrack, 'video');

      // replaceTrack already swaps the camera out of local_stream. Replace it
      // on the senders directly so the screen track is never re-disabled.
      Object.values(pc.current || {}).forEach(conn => {
        const sender = conn.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      });

      screenSharingRef.current = true;
      setScreenSharing(true);
      return true;
    } catch (err) {
      console.error("Failed to start screen share", err);
      return false;
    }
  };

  const stopScreenShare = async () => {
    console.log("Screen sharing has ended");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        ...constraints,
        audio: false
      });
      stream.getVideoTracks().forEach(track => { track.enabled = videoEnabledRef.current; });
      const videoTrack = stream.getVideoTracks()[0];
      replaceTrack(videoTrack, 'video');
      updatePcStreams(stream, 'video');
      screenSharingRef.current = false;
      setScreenSharing(false);
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
      stream.getVideoTracks().forEach(track => { track.enabled = videoEnabledRef.current; });
      const videoTrack = stream.getVideoTracks()[0];
      replaceTrack(videoTrack, 'video');
      updatePcStreams(stream, 'video');
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
      stream.getAudioTracks().forEach(track => { track.enabled = audioEnabledRef.current; });
      const audioTrack = stream.getAudioTracks()[0];
      replaceTrack(audioTrack, 'audio');
      updatePcStreams(stream, 'audio');
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
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    Object.values(pc.current).forEach(conn => {
      conn.getSenders().forEach(sender => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      conn.getReceivers().forEach(receiver => {
        if (receiver.track) {
          receiver.track.stop();
        }
      });
      conn.close();
    });
    pc.current = {};

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
