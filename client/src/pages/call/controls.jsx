import { Button } from 'react-bootstrap';
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaEllipsisV } from 'react-icons/fa';

function Controls({ 
  localAudio, 
  localVideo, 
  localStream, 
  getStreamTrackStatus 
}) {

  const setTrackEnabled = (type, enabled) => {
    const tracks = type === "audio" 
      ? localStream.getAudioTracks() 
      : localStream.getVideoTracks();

    tracks.forEach(track => track.enabled = enabled);
    getStreamTrackStatus();
  };

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
          onClick={() => setTrackEnabled("audio", !localAudio[0]?.enabled)}
        >
          {localAudio[0]?.enabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </Button>
        <Button
          onClick={() => setTrackEnabled("video", !localVideo[0]?.enabled)}
        >
          {localVideo[0]?.enabled ? <FaVideo /> : <FaVideoSlash />}
        </Button>
        <Button
          variant="danger"
          onClick={() => {}}
        >
          <FaPhoneSlash />
        </Button>
        <Button
          variant="secondary"
          onClick={() => {}}
        >
          <FaEllipsisV />
        </Button>
      </div>
    </div>
  );
}

export default Controls;