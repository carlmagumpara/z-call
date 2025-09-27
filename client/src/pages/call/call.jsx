import adapter from 'webrtc-adapter';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Container, Button, ButtonGroup } from 'react-bootstrap';
import { 
  FaVideo, 
  FaVideoSlash, 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaPhoneSlash, 
  FaShareSquare, 
  FaEllipsisV 
} from 'react-icons/fa';
import { PiVideoConference } from 'react-icons/pi';
import { socket } from '@/shared/socket';
import { usePresence } from '@/contexts/presence';
import { iceConfig } from './config';

import Video from './components/video';

function Call({ 
  users = [],
  initialVideo = true, 
  initialAudio = true
}) {
  const navigate = useNavigate();
  const { room_id } = useParams();
  const socket_id = socket.id;
  const pc = useRef({});
  const pendingCandidates = useRef({});
  const [local_stream, setLocalStream] = useState(null);
  const [local_audio, setLocalAudio] = useState([]);
  const [local_video, setLocalVideo] = useState([]);
  const [media_status, setMediaStatus] = useState({});
  const [screen_sharing, setScreenSharing] = useState(false);
  const [layout, setLayout] = useState('single-grid');
  const [selected, setSelected] = useState(null);

  const getStreamTrackStatus = () => {
    if (!local_stream) return;

    const audioTracks = local_stream.getAudioTracks();
    const videoTracks = local_stream.getVideoTracks();

    setLocalAudio(audioTracks);
    setLocalVideo(videoTracks);
  };

  const setTrackEnabled = (type, enabled) => {
    const tracks = type === "audio" 
      ? local_stream.getAudioTracks() 
      : local_stream.getVideoTracks();

    tracks.forEach(track => track.enabled = enabled);
    getStreamTrackStatus();
  };

  const setUpScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true,
        audio: true,
      });
      const screenTrack = screenStream.getVideoTracks()[0];

      screenTrack.onended = async () => {        
        console.log("Screen sharing has ended");
        const localStream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 60 }
          },
          audio: true,
        });
        const localTrack = localStream.getVideoTracks()[0];

        local_stream.removeTrack(local_stream.getVideoTracks()[0]);
        local_stream.addTrack(localTrack);

        setScreenSharing(false);
        Object.keys(pc.current || {}).forEach(sid => {
          const sender = pc.current[sid].getSenders().find(s => s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(localTrack);
          }
        });
      };

      local_stream.removeTrack(local_stream.getVideoTracks()[0]);
      local_stream.addTrack(screenTrack);
      setScreenSharing(true);

      Object.keys(pc.current || {}).forEach(sid => {
        const sender = pc.current[sid].getSenders().find(s => s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });
      console.log('Local video added');
    } catch (err) {
      console.error("Failed to get local stream", err);
    }
  };

  useEffect(() => {
    let localStream;
    const setUpLocalStream = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: true,
        });
        localStream.getVideoTracks().forEach(track => track.enabled = initialVideo);
        localStream.getAudioTracks().forEach(track => track.enabled = initialAudio);
        setLocalStream(localStream);
        const localVideoEl = document.getElementById("local");
        if (localVideoEl) localVideoEl.srcObject = localStream;
        console.log('Local video added');
      } catch (err) {
        console.error("Failed to get local stream", err);
      }
    };

    setUpLocalStream();
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initialVideo, initialAudio]);

  useEffect(() => {
    const attemptReconnect = async (peerId, retries = 10, delay = 1000) => {
      console.log(`Attempting reconnect to ${peerId}, retries left: ${retries}`);
      const conn = pc.current[peerId];
      const state = conn?.iceConnectionState;

      if (!conn || ["closed", "disconnected", "failed"].includes(state)) {
        return rebuildPeerConnection(peerId);
      }

      if (retries <= 0) {
        console.log("Failed to reconnect", peerId);
        return rebuildPeerConnection(peerId);
      }

      try {
        const offer = await conn.createOffer({ iceRestart: true });
        await conn.setLocalDescription(offer);
        socket.emit("offer", { to: peerId, sdp: offer });
        console.log("ICE restart triggered for", peerId);
      } catch (err) {
        console.error("ICE restart failed, rebuilding connection", err);
        return rebuildPeerConnection(peerId); 
      }

      setTimeout(() => attemptReconnect(peerId, retries - 1, delay), delay);
    };

    const createPeerConnection = (peerId) => {
      console.log('createPeerConnection', peerId);

      if (pc.current[peerId]) return;

      const newPc = new RTCPeerConnection(iceConfig);
      pc.current[peerId] = newPc;

      local_stream?.getTracks().forEach(track => {
        newPc.addTrack(track, local_stream);
      });

      newPc.ontrack = (event) => {
        console.log('new track added: ', peerId);

        const remoteStream = event.streams[0];
        const remoteVideoEl = document.getElementById(`remote-${peerId}`);
        if (remoteVideoEl) {
          remoteVideoEl.srcObject = remoteStream
        };
        pc.current[peerId].remoteStream = remoteStream;
      };

      newPc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", { to: peerId, candidate: e.candidate });
        }
      };

      newPc.oniceconnectionstatechange = () => {
        console.log("ICE state:", newPc.iceConnectionState);

        if (newPc.iceConnectionState === "failed" ||
            newPc.iceConnectionState === "disconnected") {
          console.warn("Connection failed with", peerId);
          attemptReconnect(peerId);
        }
      };

      console.log("Created RTCPeerConnection for:", peerId);
    };

    const startConnection = async (peerId) => {
      console.log('startConnection', peerId);
      createPeerConnection(peerId);
      const conn = pc.current[peerId];
      if (!conn) return;

      const offer = await conn.createOffer();
      await conn.setLocalDescription(offer);

      socket.emit("offer", { 
        to: peerId, 
        sdp: offer 
      });
    };

    const rebuildPeerConnection = async (peerId) => {
      console.log('rebuildPeerConnection', peerId);
      if (pc.current[peerId]) {
        pc.current[peerId].close();
        delete pc.current[peerId];
      }
      await startConnection(peerId);
    };

    const handleOffer = async ({ from, sdp }) => {
      console.log('handleOffer', from);
      const conn = pc.current[from] || new RTCPeerConnection(iceConfig);
      if (!pc.current[from]) {
        pc.current[from] = conn;

        local_stream?.getTracks().forEach(track => {
          conn.addTrack(track, local_stream);
        });

        conn.ontrack = (event) => {
          console.log('new track added: ', from);
          const remoteStream = event.streams[0];
          const remoteVideoEl = document.getElementById(`remote-${from}`);
          if (remoteVideoEl) {
            remoteVideoEl.srcObject = remoteStream;
          }
          pc.current[from].remoteStream = remoteStream;
        };

        conn.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("ice-candidate", { to: from, candidate: e.candidate });
          }
        };
      }

      await conn.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await conn.createAnswer();
      await conn.setLocalDescription(answer);
      socket.emit("answer", { to: from, sdp: answer });

      if (pendingCandidates.current[from]) {
        for (const candidate of pendingCandidates.current[from]) {
          try {
            await conn.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("Added queued ICE candidate from:", from);
          } catch (err) {
            console.error("Error adding queued candidate", err);
          }
        }
        delete pendingCandidates.current[from];
      }
    };

    const handleAnswer = async ({ from, sdp }) => {
      console.log('handleAnswer', from);
      const conn = pc.current[from];
      if (conn) {
        try {
          if (conn.signalingState === "have-local-offer") {
            await conn.setRemoteDescription(new RTCSessionDescription(sdp));
            console.log("Remote answer set for:", from);
          } else {
            console.warn("Skipping answer because state is", conn.signalingState);
          }

          if (pendingCandidates.current[from]) {
            for (const candidate of pendingCandidates.current[from]) {
              try {
                await conn.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (err) {
                console.error("Error adding queued candidate from answer handler", err);
              }
            }
            delete pendingCandidates.current[from];
          }
        } catch (err) {
          console.warn("Failed to set remote description for answer", from, err);
        }
      }
    };

    const handleIceCandidate = async ({ from, candidate }) => {
      console.log('handleIceCandidate', from);
      const conn = pc.current[from];
      if (!conn) {
        console.warn("Peer connection not found for ICE candidate from:", from);
        return;
      }
      
      if (conn.remoteDescription) {
        try {
          await conn.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Added ICE candidate from:", from);
        } catch (err) {
          console.error("Error adding ICE candidate", err);
        }
      } else {
        if (!pendingCandidates.current[from]) {
          pendingCandidates.current[from] = [];
        }
        pendingCandidates.current[from].push(candidate);
        console.log("Queued ICE candidate from:", from);
      }
    };

    if (local_stream && users.length > 1) {
      console.log('Users to connect', users);
      setTimeout(() => {
        users
        .filter(item => item.socket_id !== socket_id)
        .forEach(item => startConnection(item.socket_id));
      }, 3000);
    }

    getStreamTrackStatus();

    const handleMediaStatus = ({ socket_id, data }) => {
      console.log('handleMediaStatus', data);
      setMediaStatus(prevState => ({
        ...prevState,
        [socket_id]: data
      }));
    };
    
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("media-status", handleMediaStatus);

    return () => {
      Object.values(pc.current).forEach(conn => conn.close());
      pc.current = {};
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("media-status", handleMediaStatus);
    };
  }, [users, local_stream]);

  useEffect(() => {
    console.log('Send media status...');
    socket.emit("media-status", {
      room_id,
      data: {
        screen_sharing,
        video: local_video?.[0]?.enabled || false,
        audio: local_audio?.[0]?.enabled || false,
      }
    });
  }, [local_audio, local_video, users, screen_sharing]);

  useEffect(() => {
    Object.keys(pc.current || {}).forEach(sid => {
      const user = users.find(item => item.socket_id === sid);
      if (!user) {
        pc.current[sid].close();
        delete pc.current[sid];
      }
    });
  }, [users, layout]);

  useEffect(() => {
    const localVideoEl = document.getElementById("local");
    const selectedVideoEl = document.getElementById("selected");

    if (localVideoEl) {
      localVideoEl.srcObject = local_stream;
    };

    if(layout === 'single-grid') {
      if (selectedVideoEl) {
        if(selected && selected.user?.socket_id !== socket_id) {
          selectedVideoEl.srcObject = pc.current[selected.user.socket_id].remoteStream;
        } else {
          selectedVideoEl.srcObject = local_stream;
        }
      }
    }

    Object.keys(pc.current || {}).forEach(sid => {
      const videoEl = document.getElementById(`remote-${sid}`);
      if (videoEl) {
        videoEl.srcObject = pc.current[sid].remoteStream;
      };
    });
  }, [selected, layout, local_stream]);

  const renderVideos = () => {
    const defaultMedia = {
      screen_sharing: false,
      audio: false, 
      video: false 
    };

    const videos = users
    .map(item => {
      if(item.socket_id === socket_id) {
        return {
          id: 'local',
          autoPlay: true,
          playsInline: true,
          muted: true,
          myself: true,
          user: item,
          media: media_status[item.socket_id] || defaultMedia,
        }
      }

      return {
        id: `remote-${item.socket_id}`,
        autoPlay: true,
        playsInline: true,
        myself: false,
        user: item,
        media: media_status[item.socket_id] || defaultMedia,
      }
    });

    return videos.map(item => (
      <Video
        {...item}
        key={item.socket_id}
        onVideoSelect={() => setSelected(item)}
      />
    ));
  };

  return (
    <div className="d-flex flex-column w-100 vh-100">
      <div className="flex-grow-1 w-100 overflow-auto video-call-container">
        {layout === 'grid' ? (
          <div className="video-call-container-grid">
            <div className="video-masonry">
              {renderVideos()}
            </div>
          </div>
        ) : (
          <div className="video-call-container-single-grid">
            <div className="main-video">
              <video 
                id="selected"
                autoPlay={true}
                playsInline={true}
                muted={true}
              ></video>
            </div>
            <div className="side-videos">
              {renderVideos()}
            </div>
          </div>
        )}
      </div>
      <div className="flex-shrink-1 video-call-controls-container">
        <div
          className="d-flex justify-content-center align-items-center w-100 h-100"
          style={{
            bottom: 0
          }}
        >
          <ButtonGroup
            size="lg"
            className=""
          >
            <Button
              variant={local_audio[0]?.enabled ? 'primary' : 'secondary'}
              onClick={() => setTrackEnabled("audio", !local_audio[0]?.enabled)}
            >
              {local_audio[0]?.enabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
            </Button>
            <Button
              variant={local_video[0]?.enabled ? 'primary' : 'secondary'}
              onClick={() => setTrackEnabled("video", !local_video[0]?.enabled)}
            >
              {local_video[0]?.enabled ? <FaVideo /> : <FaVideoSlash />}
            </Button>
            <Button
              variant={screen_sharing ? 'primary' : 'secondary'}
              onClick={setUpScreenShare}
            >
              <FaShareSquare />
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
        </div>
      </div>
    </div>
  );
}

export default Call;