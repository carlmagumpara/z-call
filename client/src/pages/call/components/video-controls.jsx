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
import { PiVideoConference } from 'react-icons/pi'
import { useVideoCall } from '../video-call-context';

function VideoControls() {
  const navigate = useNavigate();
  const {
    video_enabled, 
    audio_enabled,
    screen_sharing,
    layout,
    setTrackEnabled,
    setupScreenShare,
    stopScreenShare,
    setLayout,
  } = useVideoCall();

  return (
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
      <Button
        variant={screen_sharing ? 'primary' : 'secondary'}
        onClick={() => screen_sharing ? stopScreenShare() : setupScreenShare()}
      >
        {screen_sharing ? <MdOutlineScreenShare /> : <MdOutlineStopScreenShare />}
      </Button>
      <Button
        variant={layout === 'single-grid' ? 'primary' : 'secondary'}
        onClick={() => setLayout(prevState => prevState === 'grid' ? 'single-grid' : 'grid')}
      >
        <PiVideoConference />
      </Button>
      <Button
        variant="secondary"
        onClick={() => {}}
      >
        <FaEllipsisV />
      </Button>
      <Button
        variant="danger"
        onClick={() => navigate('/')}
      >
        <FaPhoneSlash />
      </Button>
    </ButtonGroup>
  )
}

export default VideoControls;