import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash } from 'react-icons/fa';

function Controls({ localStream }) {
  const [audio, setAudio] = useState([]);
  const [video, setVideo] = useState([]);

  const getStreamTrackStatus = () => {
    if (!localStream) return;

    const audioTracks = localStream.getAudioTracks();
    const videoTracks = localStream.getVideoTracks();

    const summarize = (track) => ({
      id: track.id,
      kind: track.kind,
      enabled: track.enabled,
      muted: track.muted ?? false,
      readyState: track.readyState,
      label: track.label,
    });

    setAudio(audioTracks.map(summarize));
    setVideo(videoTracks.map(summarize));
  }

  const setTrackEnabled = (type, enabled) => {
    const tracks = type === "audio" 
      ? localStream.getAudioTracks() 
      : localStream.getVideoTracks();

    tracks.forEach(track => track.enabled = enabled);
    getStreamTrackStatus();
  };

  useEffect(() => {
    getStreamTrackStatus();
  }, []);

  useEffect(() => {
    console.log('send updates');
  }, [audio, video]);

  return (
    <div
      className="position-absolute d-flex justify-content-center align-items-center w-100"
      style={{
        bottom: 0
      }}
    >
      <div
        className="d-flex justify-content-center align-items-center gap-3 p-5 video-controls"
      >
        <Button
          onClick={() => setTrackEnabled("audio", !audio[0]?.enabled)}
        >
          {audio[0]?.enabled ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </Button>
        <Button
          onClick={() => setTrackEnabled("video", !video[0]?.enabled)}
        >
          {video[0]?.enabled ? <FaVideoSlash /> :<FaVideo />}
        </Button>
        <Button
          variant="danger"
          onClick={() => {}}
        >
          <FaPhoneSlash />
        </Button>
      </div>
    </div>
  );
}

export default Controls;