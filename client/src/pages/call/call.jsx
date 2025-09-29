import adapter from 'webrtc-adapter';
import { useState, useEffect, useRef } from 'react';
import { Container, Button, ButtonGroup } from 'react-bootstrap';
import { socket } from '@/shared/socket';
import { iceConfig } from './config';
import Video from './components/video';
import SingleVideo from './components/single-video';
import VideoControls from './components/video-controls';
import { useRoom } from './room-context';
import { useVideoCall } from './video-call-context';

function Call() {
  const socket_id = socket.id;
  const { roomId, users } = useRoom();
  const {
    pc,
    audio,
    video_input_device_id,
    audio_input_device_id,
    audio_output_device_id,
    local_stream,
    video_enabled, 
    audio_enabled,
    screen_sharing,
    layout,
    initializeLocalStream,
    setupScreenShare,
    setTrackEnabled,
    setLayout,
    media_status, 
    setMediaStatus
  } = useVideoCall();
  const pendingCandidates = useRef({});
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    initializeLocalStream();
  }, []);

  const updateRemoteStreams = async (peerId, remoteStream) => {
    const videoTrack = remoteStream.getVideoTracks()[0];
    const audioTrack = remoteStream.getAudioTracks()[0];
    const remoteVideoEl = document.getElementById(`remote-video-${peerId}`);
    const remoteAudioEl = document.getElementById(`remote-audio-${peerId}`);
    if (remoteVideoEl) {
      remoteVideoEl.srcObject = new MediaStream([videoTrack]);
    };
    if(remoteAudioEl) {
      remoteAudioEl.srcObject = new MediaStream([audioTrack]);
    }    
  };

  useEffect(() => {
    const localVideoEl = document.getElementById("local");
    if (localVideoEl) {
      localVideoEl.srcObject = local_stream;
    };

    Object.keys(pc.current || {}).forEach(peerId => {
      const remoteStream = pc.current[peerId].remoteStream;
      updateRemoteStreams(peerId, remoteStream);
    });
  }, [local_stream, layout]);

  useEffect(() => {

    const onTrack = (event, peerId) => {
      console.log('new track added: ', peerId);
      const remoteStream = event.streams[0];
      pc.current[peerId].remoteStream = remoteStream;
      updateRemoteStreams(peerId, remoteStream);
    };

    const onIceCandidate = (event, peerId) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { 
          to: peerId, 
          candidate: event.candidate 
        });
      }
    };

    const onIceConnectionStateChange = (conn, peerId) => {
      console.log("ICE state:", conn.iceConnectionState);
      if (conn.iceConnectionState === "failed" ||
          conn.iceConnectionState === "disconnected") {
        console.warn("Connection failed with", peerId);
        attemptReconnect(peerId);
      }
    };

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
      pc.current[peerId] = new RTCPeerConnection(iceConfig);
      const conn = pc.current[peerId];
      local_stream?.getTracks().forEach(track => conn.addTrack(track, local_stream));
      conn.ontrack = (event) => onTrack(event, peerId);
      conn.onicecandidate = (event) => onIceCandidate(event, peerId);
      conn.oniceconnectionstatechange = () => onIceConnectionStateChange(conn, peerId);

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
        local_stream?.getTracks().forEach(track => conn.addTrack(track, local_stream));
        conn.ontrack = (event) => onTrack(event, from);
        conn.onicecandidate = (event) => onIceCandidate(event, from);
        conn.oniceconnectionstatechange = () => onIceConnectionStateChange(conn, from);
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

    const handleMediaStatus = ({ socket_id, data }) => {
      console.log('handleMediaStatus', data);
      setMediaStatus(prevState => ({
        ...prevState,
        [socket_id]: data
      }));
    };

    if (local_stream && users.length > 1) {
      setTimeout(() => {
        users
        .filter(item => item.socket_id !== socket_id)
        .forEach(item => startConnection(item.socket_id));
      }, 3000);
    }

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("media-status", handleMediaStatus);

    return () => {
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("media-status", handleMediaStatus);
    };
  }, [users, local_stream]);

  useEffect(() => {
    Object.keys(pc.current || {}).forEach(peerId => {
      const user = users.find(item => item.socket_id === peerId);
      if (!user) {
        console.log('Peer removed: ', peerId);
        pc.current[peerId].close();
        delete pc.current[peerId];
      }
    });
  }, [users]);

  useEffect(() => {
    console.log('Send media status...');
    socket.emit("media-status", {
      room_id: roomId,
      data: {
        screen_sharing,
        video: video_enabled || false,
        audio: audio_enabled || false,
      }
    });
  }, [video_enabled, audio_enabled, screen_sharing]);

  const getVideos = () => {
    const defaultMedia = {
      screen_sharing: false,
      audio: false, 
      video: false 
    };

    return users
    .map(item => ({
      id: item.socket_id,
      myself: item.socket_id === socket_id,
      user: item,
      media: media_status[item.socket_id] || defaultMedia,
    }));
  };

  const renderSingleVideo = () => {
    const localVideo = getVideos().find(item => item.myself);
    const singleVideo = getVideos().find(item => item.id === selected);

    return (
      <SingleVideo 
        selected={(selected && singleVideo) ? singleVideo : localVideo} 
      />
    );
  };

  const onVideoSelect = item => {
    setLayout('single-grid');
    setSelected(item);
  };

  return (
    <div className="d-flex flex-column w-100 vh-100">
      <div className="flex-grow-1 w-100 overflow-auto video-call-container">
        {layout === 'grid' ? (
          <div className="video-call-container-grid">
            <div className="video-masonry">
              {getVideos().map(item => (
                <Video
                  key={item.id}
                  onVideoSelect={onVideoSelect}
                  {...item}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="video-call-container-single-grid">
            <div className="main-video">
              {renderSingleVideo()}
            </div>
            <div className="side-videos">
              {getVideos().map(item => (
                <Video
                  key={item.id}
                  onVideoSelect={onVideoSelect}
                  {...item}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex-shrink-1 video-call-controls-container">
        <div
          className="d-flex justify-content-center align-items-center w-100 h-100 bottom-0"
        >
          <VideoControls />
        </div>
      </div>
    </div>
  );
}

export default Call;